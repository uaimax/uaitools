"""Service para logging híbrido: Sentry ou banco de dados."""

import traceback
from typing import Any, Dict, Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpRequest

from apps.core.models import ApplicationLog

User = get_user_model()


def _get_client_ip(request: Optional[HttpRequest]) -> Optional[str]:
    """Obtém IP do cliente do request."""
    if not request:
        return None

    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def _log_to_sentry(
    level: str,
    message: str,
    error_type: Optional[str] = None,
    stack_trace: Optional[str] = None,
    extra_data: Optional[Dict[str, Any]] = None,
    user: Optional[User] = None,
    request: Optional[HttpRequest] = None,
) -> None:
    """Envia log para Sentry ou GlitchTip (compatível com API do Sentry)."""
    try:
        import sentry_sdk

        # Mapear nível para Sentry
        sentry_level = "error" if level == "ERROR" else "fatal"

        with sentry_sdk.push_scope() as scope:
            # Configurar contexto do usuário
            if user:
                scope.user = {
                    "id": str(user.id),
                    "email": user.email,
                    "username": user.username,
                }

            # Adicionar dados extras
            if extra_data:
                scope.set_context("extra", extra_data)

            # Adicionar informações do request
            if request:
                scope.set_context("request", {
                    "url": request.build_absolute_uri(),
                    "method": request.method,
                    "ip": _get_client_ip(request),
                })

            # Adicionar tipo de erro
            if error_type:
                scope.set_tag("error_type", error_type)

            # Capturar exceção ou mensagem
            if stack_trace:
                # Se temos stack trace, criar exceção
                exc = Exception(message)
                exc.__traceback__ = None  # Não podemos reconstruir traceback facilmente
                sentry_sdk.capture_exception(exc, level=sentry_level)
            else:
                # Apenas mensagem
                sentry_sdk.capture_message(message, level=sentry_level)

    except ImportError:
        # Sentry não instalado, ignorar silenciosamente
        pass
    except Exception:
        # Não queremos que erros de logging quebrem a aplicação
        pass


def _log_to_database(
    level: str,
    message: str,
    error_type: Optional[str] = None,
    stack_trace: Optional[str] = None,
    extra_data: Optional[Dict[str, Any]] = None,
    request: Optional[HttpRequest] = None,
    user: Optional[User] = None,
    workspace=None,
    session_id: Optional[str] = None,
    url: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Salva log no banco de dados."""
    try:
        # Obter workspace do request se não fornecido
        if not workspace and request:
            workspace = getattr(request, "workspace", None)

        # Obter user do request se não fornecido
        if not user and request:
            user = getattr(request, "user", None)
            if user and not user.is_authenticated:
                user = None

        # Obter IP e user agent do request
        if not url and request:
            url = request.build_absolute_uri()
        if not user_agent and request:
            user_agent = request.META.get("HTTP_USER_AGENT", "")

        ip_address = _get_client_ip(request)

        # Criar log no banco
        ApplicationLog.objects.create(
            workspace=workspace,
            level=level,
            source="backend",
            message=message,
            error_type=error_type,
            url=url,
            stack_trace=stack_trace,
            extra_data=extra_data or {},
            user=user,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    except Exception:
        # Não queremos que erros de logging quebrem a aplicação
        pass


def log_error(
    level: str,
    message: str,
    error_type: Optional[str] = None,
    stack_trace: Optional[str] = None,
    extra_data: Optional[Dict[str, Any]] = None,
    request: Optional[HttpRequest] = None,
    user: Optional[User] = None,
    workspace=None,
    session_id: Optional[str] = None,
    url: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Log híbrido: Sentry se configurado, senão banco.

    Args:
        level: Nível do log ("ERROR" ou "CRITICAL")
        message: Mensagem do erro
        error_type: Tipo do erro (ex: "ValueError", "KeyError")
        stack_trace: Stack trace completo (opcional)
        extra_data: Dados extras em formato dict (opcional)
        request: Request HTTP (opcional, para obter IP, user, workspace)
        user: Usuário relacionado (opcional)
        workspace: Workspace relacionado (opcional)
        session_id: ID da sessão (opcional)
        url: URL onde ocorreu o erro (opcional)
        user_agent: User agent do cliente (opcional)
    """
    use_sentry = getattr(settings, "USE_SENTRY", False)

    if use_sentry:
        # Enviar para Sentry
        _log_to_sentry(
            level=level,
            message=message,
            error_type=error_type,
            stack_trace=stack_trace,
            extra_data=extra_data,
            user=user,
            request=request,
        )
    else:
        # Salvar no banco
        _log_to_database(
            level=level,
            message=message,
            error_type=error_type,
            stack_trace=stack_trace,
            extra_data=extra_data,
            request=request,
            user=user,
            workspace=workspace,
            session_id=session_id,
            url=url,
            user_agent=user_agent,
        )

