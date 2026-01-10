"""Sistema de auditoria LGPD - Registra todas as mudanças em dados pessoais."""

from typing import TYPE_CHECKING, Any, Optional

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

if TYPE_CHECKING:
    from apps.core.models import AuditLog

# Thread-local storage para rastrear usuário atual
import threading

_thread_locals = threading.local()


def get_current_user() -> Optional[User]:
    """Retorna o usuário atual da thread."""
    return getattr(_thread_locals, "user", None)


def set_current_user(user: Optional[User]) -> None:
    """Define o usuário atual da thread."""
    _thread_locals.user = user


def get_client_ip(request) -> Optional[str]:
    """Extrai o IP do cliente do request."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def log_audit(
    instance: models.Model,
    action: str,
    field_name: Optional[str] = None,
    old_value: Any = None,
    new_value: Any = None,
    request=None,
) -> "AuditLog":
    """Registra um evento de auditoria.

    Args:
        instance: Instância do model alterado
        action: Ação realizada (create, update, delete, view)
        field_name: Nome do campo alterado (opcional)
        old_value: Valor antigo (opcional)
        new_value: Valor novo (opcional)
        request: Request HTTP (opcional, para IP e User-Agent)

    Returns:
        AuditLog criado
    """
    from apps.core.models import AuditLog

    user = get_current_user()
    # Tentar obter workspace
    workspace = None
    workspace_id = None
    
    # Se a ação for delete, não tentar buscar workspace do banco
    # pois o objeto pode já ter sido deletado
    is_delete_action = action == "delete"
    
    try:
        # Primeiro tentar workspace_id (mais seguro, não precisa de query adicional)
        if hasattr(instance, "workspace_id") and instance.workspace_id:
            workspace_id = instance.workspace_id
            # Se não for delete, tentar buscar do banco
            if not is_delete_action:
                from apps.accounts.models import Workspace
                try:
                    workspace = Workspace.objects.get(pk=instance.workspace_id)
                except (Workspace.DoesNotExist, ValueError, TypeError):
                    pass
        # Se não tiver workspace_id, tentar acessar workspace diretamente
        elif hasattr(instance, "workspace"):
            try:
                workspace = getattr(instance, "workspace", None)
                # Se for um objeto relacionado, garantir que está carregado
                if workspace and hasattr(workspace, 'pk'):
                    if workspace.pk:
                        workspace_id = workspace.pk
                    else:
                        workspace = None
            except Exception:
                pass
        # Se o usuário for de um workspace específico, usar isso como fallback
        if not workspace and user and hasattr(user, 'workspace') and user.workspace:
            workspace = user.workspace
            if workspace and hasattr(workspace, 'pk') and workspace.pk:
                workspace_id = workspace.pk
    except Exception:
        # Se houver qualquer erro ao obter workspace, continuar sem ele
        pass
    
    # Se for delete e temos workspace_id mas não o objeto, não tentar buscar do banco
    # pois o workspace pode já ter sido deletado
    if is_delete_action and workspace_id and not workspace:
        # Para delete, não tentar buscar do banco - usar None ou workspace_id direto
        # Mas como o campo é ForeignKey, precisamos do objeto ou None
        workspace = None

    # Identificar se é dado pessoal
    personal_data_fields = [
        "email",
        "cpf",
        "phone",
        "telefone",
        "name",
        "nome",
        "address",
        "endereco",
        "birth_date",
        "data_nascimento",
    ]
    is_personal = field_name and field_name.lower() in personal_data_fields

    # Extrair titular dos dados (email é o mais comum)
    data_subject = None
    if is_personal:
        if hasattr(instance, "email") and instance.email:
            data_subject = instance.email
        elif hasattr(instance, "user") and hasattr(instance.user, "email"):
            data_subject = instance.user.email

    # Serializar valores
    def serialize_value(value: Any) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, (str, int, float, bool)):
            return str(value)
        if isinstance(value, models.Model):
            return f"{value.__class__.__name__}#{value.pk}"
        return str(value)

    # Obter IP e User-Agent do request
    ip_address = None
    user_agent = None
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]

    # Se workspace for None mas temos workspace_id e NÃO for delete, tentar obter do banco uma última vez
    # Para delete, não tentar buscar pois o objeto pode já ter sido deletado
    if workspace is None and workspace_id and not is_delete_action:
        try:
            from apps.accounts.models import Workspace
            workspace = Workspace.objects.get(pk=workspace_id)
        except (Workspace.DoesNotExist, ValueError, TypeError):
            # Se não conseguir obter, deixar como None (campo permite null)
            pass

    # Criar log (workspace pode ser None se não conseguir obter - campo permite null)
    try:
        log = AuditLog.objects.create(
            workspace=workspace,
            user=user,
            action=action,
            model_name=f"{instance.__class__.__module__}.{instance.__class__.__name__}",
            object_id=str(instance.pk),
            field_name=field_name,
            old_value=serialize_value(old_value),
            new_value=serialize_value(new_value),
            ip_address=ip_address,
            user_agent=user_agent,
            is_personal_data=is_personal,
            data_subject=data_subject,
        )
    except Exception as e:
        # Se houver erro ao criar log (ex: foreign key), logar e continuar
        # Não queremos que erros de auditoria quebrem a aplicação
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Erro ao criar log de auditoria: {e}")
        return None

    return log
