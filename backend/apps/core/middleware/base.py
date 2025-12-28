"""Middleware para multi-tenancy e auditoria LGPD."""

import re
from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponse

if TYPE_CHECKING:
    from apps.accounts.models import Workspace


class UUIDSessionMiddleware:
    """Middleware que limpa sessões com IDs antigos (inteiros) após migração para UUID.

    Quando o User model migra de BigAutoField para UUID, sessões antigas podem ter
    IDs inteiros armazenados que não são mais válidos. Este middleware detecta
    e limpa essas sessões inválidas antes que o AuthenticationMiddleware tente usá-las.
    """

    def __init__(self, get_response: callable) -> None:
        """Inicializa o middleware."""
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Processa a requisição e limpa sessões inválidas."""
        # Verifica se há uma sessão ativa
        if hasattr(request, "session") and request.session:
            # O Django usa esta chave para armazenar o user_id na sessão
            from django.contrib.auth import SESSION_KEY

            if SESSION_KEY in request.session:
                user_id = request.session.get(SESSION_KEY)
                if user_id is not None:
                    try:
                        # Tenta converter para UUID (se falhar, é ID antigo)
                        User = get_user_model()
                        User._meta.pk.to_python(user_id)
                    except (ValidationError, ValueError, TypeError):
                        # ID inválido (provavelmente inteiro antigo) - limpa a sessão
                        request.session.flush()

        return self.get_response(request)


class WorkspaceMiddleware:
    """Middleware que define request.workspace baseado no header X-Workspace-ID.

    O workspace é definido a partir do header HTTP 'X-Workspace-ID' que deve conter
    o slug do workspace. Se o workspace não for encontrado ou o header não existir,
    request.workspace será None.

    Também define o usuário atual para auditoria LGPD.
    """

    def __init__(self, get_response: callable) -> None:
        """Inicializa o middleware."""
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Processa a requisição e define request.workspace e usuário para auditoria."""
        # Importa aqui para evitar circular imports
        from apps.accounts.models import Workspace
        from apps.core.audit import set_current_user
        import uuid as uuid_lib

        # Obtém o identificador do workspace do header X-Workspace-ID
        # Aceita tanto slug quanto UUID
        workspace_identifier = request.headers.get("X-Workspace-ID", "").strip()

        # Log para debug (apenas em desenvolvimento)
        import logging
        logger = logging.getLogger("apps.core.middleware")
        if workspace_identifier:
            logger.debug(f"[WorkspaceMiddleware] Header recebido: '{workspace_identifier}'")

        # Validação de formato (UUID primeiro, depois slug)
        # UUID válido: formato padrão UUID (validado pelo Python)
        # Slug válido: apenas letras minúsculas, números e hífens
        is_valid_uuid = False
        is_valid_slug = False

        if workspace_identifier:
            # Verificar UUID primeiro (mais rigoroso)
            try:
                uuid_lib.UUID(workspace_identifier)
                is_valid_uuid = True
                logger.debug(f"[WorkspaceMiddleware] ✅ Identificado como UUID válido: {workspace_identifier}")
            except (ValueError, TypeError):
                # Não é UUID, verificar se é slug válido
                # Slug válido: apenas letras minúsculas, números e hífens
                if re.match(r"^[a-z0-9-]+$", workspace_identifier):
                    is_valid_slug = True
                    logger.debug(f"[WorkspaceMiddleware] ✅ Identificado como slug válido: {workspace_identifier}")
                else:
                    logger.debug(f"[WorkspaceMiddleware] ❌ Não é UUID nem slug válido: {workspace_identifier}")

        if workspace_identifier and not is_valid_slug and not is_valid_uuid:
            # Formato inválido - definir workspace como None e continuar
            logger.warning(f"[WorkspaceMiddleware] Formato inválido: '{workspace_identifier}'")
            request.workspace = None  # type: ignore[attr-defined]
            return self.get_response(request)

        # Tenta encontrar o workspace (por UUID primeiro, depois por slug)
        workspace: "Workspace | None" = None
        if workspace_identifier:
            try:
                if is_valid_uuid:
                    # Busca por UUID (ID)
                    logger.debug(f"[WorkspaceMiddleware] Buscando workspace por UUID: {workspace_identifier}")
                    workspace = Workspace.objects.filter(is_active=True).get(id=workspace_identifier)
                    logger.info(f"[WorkspaceMiddleware] ✅ Workspace encontrado por UUID: {workspace.id} ({workspace.slug})")
                elif is_valid_slug:
                    # Busca por slug
                    logger.debug(f"[WorkspaceMiddleware] Buscando workspace por slug: {workspace_identifier}")
                    workspace = Workspace.objects.filter(is_active=True).get(slug=workspace_identifier)
                    logger.info(f"[WorkspaceMiddleware] ✅ Workspace encontrado por slug: {workspace.id} ({workspace.slug})")
            except Workspace.DoesNotExist:
                # Workspace não encontrado - request.workspace será None
                logger.warning(f"[WorkspaceMiddleware] ❌ Workspace não encontrado: '{workspace_identifier}' (is_uuid={is_valid_uuid}, is_slug={is_valid_slug})")
                pass
            except Exception as e:
                logger.error(f"[WorkspaceMiddleware] Erro ao buscar workspace: {e}", exc_info=True)
                pass

        # Define request.workspace
        request.workspace = workspace  # type: ignore[attr-defined]

        # Define usuário atual para auditoria LGPD
        # Trata erro caso a sessão tenha ID inválido (migração UUID)
        try:
            if hasattr(request, "user") and request.user.is_authenticated:
                set_current_user(request.user)
            else:
                set_current_user(None)
        except (ValidationError, ValueError, TypeError):
            # Sessão com ID inválido - limpa e continua
            if hasattr(request, "session"):
                request.session.flush()
            set_current_user(None)

        # Processa a requisição
        response = self.get_response(request)

        # Limpar usuário da thread após processar
        set_current_user(None)

        return response


class ErrorLoggingMiddleware:
    """Middleware para capturar exceções não tratadas e respostas HTTP de erro.

    Captura:
    - Exceções não tratadas (500, etc)
    - Respostas HTTP de erro (4xx, 5xx) - especialmente rate limits (429)
    Envia para o sistema de logging híbrido (Sentry ou banco de dados).
    """

    def __init__(self, get_response: callable) -> None:
        """Inicializa o middleware."""
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Processa a requisição e captura exceções e respostas de erro."""
        try:
            response = self.get_response(request)

            # Capturar respostas HTTP de erro (4xx, 5xx) para logging
            if response.status_code >= 400:
                import logging
                import sentry_sdk
                from django.conf import settings

                logger = logging.getLogger("apps")

                # Extrair informações da resposta
                try:
                    # Tentar obter corpo da resposta se disponível
                    response_body = ""
                    if hasattr(response, 'data'):
                        response_body = str(response.data)
                    elif hasattr(response, 'content'):
                        try:
                            response_body = response.content.decode('utf-8')[:500]  # Limitar tamanho
                        except:
                            response_body = str(response.content)[:500]
                except:
                    response_body = "Não foi possível obter corpo da resposta"

                # Log detalhado
                error_info = {
                    "status_code": response.status_code,
                    "method": request.method,
                    "path": request.path,
                    "user_id": getattr(request.user, "id", None) if hasattr(request, "user") and request.user.is_authenticated else None,
                    "workspace_id": getattr(request.workspace, "id", None) if hasattr(request, "workspace") else None,
                    "response_body": response_body,
                }

                # Logar no logger do Django
                if response.status_code >= 500:
                    logger.error(f"[HTTP ERROR {response.status_code}] {request.method} {request.path}", extra=error_info)
                    # Enviar para Sentry com contexto
                    with sentry_sdk.push_scope() as scope:
                        scope.set_context("http_error", error_info)
                        sentry_sdk.capture_message(
                            f"HTTP Error {response.status_code}: {request.method} {request.path}",
                            level="error"
                        )
                elif response.status_code == 429:
                    # Rate limit - logar como warning mas enviar para Sentry
                    logger.warning(f"[RATE LIMIT 429] {request.method} {request.path}", extra=error_info)
                    # Enviar para Sentry com contexto
                    with sentry_sdk.push_scope() as scope:
                        scope.set_context("rate_limit", error_info)
                        sentry_sdk.capture_message(
                            f"Rate limit atingido: {request.method} {request.path}",
                            level="warning"
                        )
                elif response.status_code >= 400:
                    logger.warning(f"[HTTP ERROR {response.status_code}] {request.method} {request.path}", extra=error_info)
                    # Enviar erros 4xx importantes para Sentry (exceto 401 de login e 404 de varredura)
                    should_report = False
                    if response.status_code == 401:
                        # Não reportar 401 de login (credenciais inválidas são esperadas)
                        if "/api/v1/auth/login/" not in request.path:
                            should_report = True
                    elif response.status_code == 404:
                        # Não reportar 404 de varredura/bots
                        bot_patterns = [
                            "/wp-", "/wp/", "/wordpress/", "/blog/", "/wp-includes/",
                            "/_next/", "/api/actions", "/api/action", "/apps",
                            "/.git/", "/xmlrpc.php", "/wlwmanifest.xml",
                            "/sito/", "/cms/", "/media/", "/web/", "/site/",
                            "/shop/", "/2019/", "/2018/", "/test/", "/news/",
                            "/website/", "/wp1/", "/wp2/"
                        ]
                        if not any(pattern in request.path for pattern in bot_patterns):
                            should_report = True
                    elif response.status_code in [403, 422]:
                        should_report = True
                    
                    if should_report:
                        with sentry_sdk.push_scope() as scope:
                            scope.set_context("http_error", error_info)
                            sentry_sdk.capture_message(
                                f"HTTP Error {response.status_code}: {request.method} {request.path}",
                                level="warning"
                            )

            return response
        except Exception as exc:
            # Importar aqui para evitar circular imports
            import traceback
            from apps.core.services.error_logger import log_error

            # Logar o erro (Sentry ou banco)
            log_error(
                level="ERROR",
                message=str(exc),
                error_type=type(exc).__name__,
                stack_trace=traceback.format_exc(),
                request=request,
                user=getattr(request, "user", None) if hasattr(request, "user") and request.user.is_authenticated else None,
            )

            # Re-raise a exceção para que o Django trate normalmente
            raise


