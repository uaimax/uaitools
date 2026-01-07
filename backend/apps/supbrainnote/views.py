"""Views para endpoints customizados do supbrainnote."""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone

from apps.supbrainnote.models import BoxShareInvite
from apps.accounts.models import User


@api_view(["POST"])
@permission_classes([AllowAny])
def accept_box_invite(request) -> Response:
    """Aceita convite de caixinha por token.

    Endpoint: POST /api/v1/supbrainnote/invites/accept/
    Body: {"token": "uuid-do-token"}

    Se o usuário não estiver autenticado, retorna erro pedindo login.
    Se o token for válido, cria BoxShare e marca convite como usado.
    """
    token = request.data.get("token")
    if not token:
        return Response(
            {"error": "Token é obrigatório"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Verificar se usuário está autenticado
    if not request.user.is_authenticated:
        return Response(
            {"error": "Usuário deve estar autenticado para aceitar convite"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        invite = BoxShareInvite.objects.get(token=token)
    except BoxShareInvite.DoesNotExist:
        return Response(
            {"error": "Convite não encontrado ou inválido"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Verificar se convite expirou
    if invite.is_expired:
        return Response(
            {"error": "Convite expirado"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Verificar se email do convite corresponde ao email do usuário autenticado
    if invite.email.lower() != request.user.email.lower():
        return Response(
            {"error": "Este convite foi enviado para outro email"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Criar compartilhamento
    from apps.supbrainnote.models import BoxShare

    share, created = BoxShare.objects.get_or_create(
        box=invite.box,
        shared_with=request.user,
        defaults={
            "permission": invite.permission,
            "invited_by": invite.invited_by,
            "status": "accepted",
            "accepted_at": timezone.now(),
        },
    )

    if not created:
        # Atualizar permissão se já existe
        share.permission = invite.permission
        share.status = "accepted"
        share.accepted_at = timezone.now()
        share.save(update_fields=["permission", "status", "accepted_at"])

    # Deletar convite (já foi usado)
    invite.delete()

    return Response(
        {
            "message": "Convite aceito com sucesso",
            "box_id": str(invite.box.id),
            "box_name": invite.box.name,
            "permission": invite.permission,
        },
        status=status.HTTP_200_OK,
    )

