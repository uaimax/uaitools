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

        # Obtém o slug do workspace do header X-Workspace-ID
        workspace_slug = request.headers.get("X-Workspace-ID", "").strip()

        # Validação de formato (slug válido) - Previne enumeração e queries maliciosas
        # Slug válido: apenas letras minúsculas, números e hífens
        if workspace_slug and not re.match(r"^[a-z0-9-]+$", workspace_slug):
            # Formato inválido - definir workspace como None e continuar
            request.workspace = None  # type: ignore[attr-defined]
            return self.get_response(request)

        # Tenta encontrar o workspace
        workspace: "Workspace | None" = None
        if workspace_slug:
            try:
                workspace = Workspace.objects.filter(is_active=True).get(slug=workspace_slug)
            except Workspace.DoesNotExist:
                # Workspace não encontrado - request.workspace será None
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
    """Middleware para capturar exceções não tratadas e enviar para logging.

    Captura exceções que não foram tratadas e envia para o sistema de logging
    híbrido (Sentry ou banco de dados).
    """

    def __init__(self, get_response: callable) -> None:
        """Inicializa o middleware."""
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Processa a requisição e captura exceções."""
        try:
            response = self.get_response(request)
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
