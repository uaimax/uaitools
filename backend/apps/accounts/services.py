"""Serviços para o app accounts."""

import uuid
from typing import Optional

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .models import LegalDocument, PasswordResetToken, User


def render_legal_document(document: LegalDocument) -> str:
    """Substitui variáveis no template usando configurações globais do SaaS.

    Todos os documentos legais são globais do sistema e usam configurações do SaaS
    definidas em settings (SAAS_WORKSPACE_*, PROJECT_NAME, etc.).

    Suporta tanto sintaxe {{variavel}} quanto [VARIAVEL] para compatibilidade.

    Args:
        document: Documento legal com template

    Returns:
        Conteúdo renderizado com variáveis substituídas
    """
    # Usar configurações globais do SaaS (settings)
    context = {
        "workspace_name": getattr(settings, "SAAS_WORKSPACE_NAME", getattr(settings, "PROJECT_NAME", "SaaS Bootstrap")),
        "workspace_legal_name": getattr(settings, "SAAS_WORKSPACE_LEGAL_NAME", getattr(settings, "SAAS_WORKSPACE_NAME", getattr(settings, "PROJECT_NAME", "SaaS Bootstrap"))),
        "workspace_cnpj": getattr(settings, "SAAS_WORKSPACE_CNPJ", ""),
        "workspace_address": getattr(settings, "SAAS_WORKSPACE_ADDRESS", ""),
        "workspace_phone": getattr(settings, "SAAS_WORKSPACE_PHONE", ""),
        "workspace_email": getattr(settings, "SAAS_WORKSPACE_EMAIL", "contato@saasbootstrap.com"),
        "workspace_website": getattr(settings, "SAAS_WORKSPACE_WEBSITE", ""),
        "workspace_city": getattr(settings, "SAAS_WORKSPACE_CITY", ""),
        "workspace_state": getattr(settings, "SAAS_WORKSPACE_STATE", ""),
        "dpo_name": getattr(settings, "SAAS_DPO_NAME", ""),
        "dpo_email": getattr(settings, "SAAS_DPO_EMAIL", ""),
        "dpo_phone": getattr(settings, "SAAS_DPO_PHONE", ""),
        "dpo_address": getattr(settings, "SAAS_DPO_ADDRESS", ""),
        "support_hours": getattr(settings, "SAAS_SUPPORT_HOURS", ""),
    }

    # Adicionar variáveis comuns
    context["current_date"] = timezone.now().strftime("%d/%m/%Y")
    context["system_name"] = getattr(settings, "PROJECT_NAME", "SaaS Bootstrap")

    # Montar endereço completo se tiver componentes
    if not context.get("workspace_address") and (context.get("workspace_city") or context.get("workspace_state")):
        address_parts = []
        if context.get("workspace_city"):
            address_parts.append(context["workspace_city"])
        if context.get("workspace_state"):
            address_parts.append(context["workspace_state"])
        context["workspace_address"] = ", ".join(address_parts)

    content = document.content

    # Mapeamento de placeholders do template para variáveis do context
    # Template usa [VARIAVEL] e também suporta {{variavel}}
    replacements = {
        # Placeholders do template [VARIAVEL] -> valores do context
        "[DATA]": context["current_date"],
        "[NOME DO SISTEMA]": context["system_name"],
        "[NOME DA EMPRESA]": context["workspace_name"],
        "[NOME COMPLETO DA EMPRESA]": context["workspace_legal_name"],
        "[CNPJ]": context["workspace_cnpj"],
        "[ENDEREÇO COMPLETO]": context["workspace_address"],
        "[TELEFONE]": context["workspace_phone"],
        "[E-MAIL DE CONTATO]": context["workspace_email"],
        "[URL DO SITE]": context["workspace_website"],
        "[CIDADE]": context["workspace_city"],
        "[ESTADO]": context["workspace_state"],
        "[HORÁRIO]": context["support_hours"],
        "[LINK PARA POLÍTICA DE PRIVACIDADE]": "#politica-privacidade",  # Link relativo ou pode ser configurável
    }

    # Substituir placeholders do template [VARIAVEL]
    for placeholder, value in replacements.items():
        content = content.replace(placeholder, str(value))

    # Também substituir formato {{variavel}} para compatibilidade
    for key, value in context.items():
        content = content.replace(f"{{{{{key}}}}}", str(value))
        # Formato [VARIAVEL] em maiúsculas com espaços
        formatted_key = key.upper().replace("_", " ")
        if f"[{formatted_key}]" not in replacements:  # Evitar duplicação
            content = content.replace(f"[{formatted_key}]", str(value))

    return content


def get_active_legal_document(document_type: str = "terms") -> LegalDocument | None:
    """Retorna o documento legal ativo mais recente.

    Todos os documentos legais são globais do sistema.

    Args:
        document_type: Tipo de documento ('terms' ou 'privacy')

    Returns:
        Documento legal ativo ou None se não existir
    """
    return (
        LegalDocument.objects.filter(
            document_type=document_type,
            is_active=True,
        )
        .order_by("-version", "-created_at")
        .first()
    )


def generate_password_reset_token(user: User) -> PasswordResetToken:
    """Gera um novo token de reset de senha para o usuário.

    Invalida tokens anteriores não usados do mesmo usuário (segurança).

    Args:
        user: Usuário para gerar o token

    Returns:
        Instância de PasswordResetToken criada
    """
    # Invalidar tokens anteriores não usados do mesmo usuário
    PasswordResetToken.objects.filter(
        user=user,
        used_at__isnull=True,
    ).update(used_at=timezone.now())

    # Criar novo token (workspace pode ser None)
    token = PasswordResetToken.objects.create(
        user=user,
        workspace=user.workspace,  # Pode ser None
        token=uuid.uuid4(),
    )

    return token


def validate_password_reset_token(token_value: uuid.UUID) -> Optional[User]:
    """Valida um token de reset de senha e retorna o usuário associado.

    Args:
        token_value: UUID do token

    Returns:
        Usuário associado ao token se válido, None caso contrário
    """
    try:
        token = PasswordResetToken.objects.get(
            token=token_value,
            used_at__isnull=True,
        )
    except PasswordResetToken.DoesNotExist:
        return None

    if not token.is_valid():
        return None

    return token.user


def send_password_reset_email(user: User, token: PasswordResetToken, request=None) -> None:
    """Envia email de reset de senha usando template dinâmico.

    Args:
        user: Usuário que solicitou o reset
        token: Token de reset gerado
        request: Request HTTP (opcional, para obter URL base)
    """
    # Obter configurações dinâmicas
    # IMPORTANTE: Sempre usar FRONTEND_URL se configurado, nunca usar request.get_host()
    # porque request.get_host() retorna o host do backend, não do frontend
    frontend_url = getattr(settings, "FRONTEND_URL", "").strip()
    if not frontend_url:
        # Fallback: usar localhost:5173 (porta padrão do Vite dev server)
        # NÃO usar request.get_host() pois retorna o host do backend
        frontend_url = "http://localhost:5173"

    reset_path = getattr(settings, "PASSWORD_RESET_URL_PATH", "/reset-password")
    reset_url = f"{frontend_url.rstrip('/')}{reset_path}?token={token.token}"

    expiration_hours = getattr(settings, "PASSWORD_RESET_TOKEN_EXPIRATION_HOURS", 24)
    project_name = getattr(settings, "PROJECT_NAME", "SaaS Bootstrap")
    support_email = getattr(settings, "SAAS_WORKSPACE_EMAIL", getattr(settings, "DEFAULT_FROM_EMAIL", "contato@saasbootstrap.com"))
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", f"noreply@{project_name.lower().replace(' ', '')}.com")
    from_name = getattr(settings, "DEFAULT_FROM_NAME", project_name)

    # Se from_name for "xxx" ou muito curto, usar project_name
    if not from_name or from_name.strip() in ("xxx", "x", ""):
        from_name = project_name

    # Contexto para template
    user_name = user.get_full_name() or user.first_name or user.email.split("@")[0]

    context = {
        "reset_url": reset_url,
        "user_name": user_name,
        "user_email": user.email,
        "project_name": project_name,
        "support_email": support_email,
        "expiration_hours": expiration_hours,
        "frontend_url": frontend_url,
    }

    # Renderizar templates
    subject = _("Redefinição de senha - {project_name}").format(project_name=project_name)
    html_content = render_to_string("emails/password_reset.html", context)
    text_content = render_to_string("emails/password_reset.txt", context)

    # Enviar email
    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=f"{from_name} <{from_email}>",
            to=[user.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
    except Exception as e:
        # Log do erro e re-raise para que a view possa tratá-lo
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            f"Erro ao enviar email de reset de senha para {user.email}: {e}",
            exc_info=True,
        )
        raise

