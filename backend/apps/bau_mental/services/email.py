"""Serviço de email para compartilhamento de caixinhas."""

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from apps.bau_mental.models import BoxShareInvite


def send_box_invite_email(invite: BoxShareInvite, request=None) -> None:
    """Envia email de convite para compartilhar caixinha.

    Args:
        invite: Convite de caixinha
        request: Request HTTP (opcional, para obter URL base)
    """
    # Obter configurações dinâmicas
    frontend_url = getattr(settings, "FRONTEND_URL", "").strip()
    if not frontend_url:
        frontend_url = "http://localhost:5173"

    accept_path = getattr(settings, "BOX_INVITE_ACCEPT_URL_PATH", "/accept-box-invite")
    accept_url = f"{frontend_url.rstrip('/')}{accept_path}?token={invite.token}"

    project_name = getattr(settings, "PROJECT_NAME", "SaaS Bootstrap")
    support_email = getattr(settings, "SAAS_WORKSPACE_EMAIL", getattr(settings, "DEFAULT_FROM_EMAIL", "contato@saasbootstrap.com"))
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", f"noreply@{project_name.lower().replace(' ', '')}.com")
    from_name = getattr(settings, "DEFAULT_FROM_NAME", project_name)

    if not from_name or from_name.strip() in ("xxx", "x", ""):
        from_name = project_name

    # Contexto para template
    inviter_name = invite.invited_by.get_full_name() if invite.invited_by else invite.invited_by.email if invite.invited_by else "Alguém"
    permission_text = "visualizar" if invite.permission == "read" else "visualizar e editar"

    context = {
        "accept_url": accept_url,
        "inviter_name": inviter_name,
        "inviter_email": invite.invited_by.email if invite.invited_by else "",
        "box_name": invite.box.name,
        "permission": invite.permission,
        "permission_text": permission_text,
        "email": invite.email,
        "project_name": project_name,
        "support_email": support_email,
        "expires_at": invite.expires_at,
        "frontend_url": frontend_url,
    }

    # Renderizar templates (criar templates depois)
    subject = f"{inviter_name} compartilhou a caixinha '{invite.box.name}' com você"
    html_content = render_to_string("bau_mental/emails/box_invite.html", context)
    text_content = render_to_string("bau_mental/emails/box_invite.txt", context)

    # Enviar email
    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=f"{from_name} <{from_email}>",
            to=[invite.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
    except Exception as e:
        # Log do erro e re-raise
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            f"Erro ao enviar email de convite de caixinha para {invite.email}: {e}",
            exc_info=True,
        )
        raise

