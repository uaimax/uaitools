"""Utilitários para o app bau_mental."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from rest_framework.request import Request
    from apps.accounts.models import Workspace


def get_or_create_workspace_for_user(request: "Request") -> "Workspace | None":
    """Obtém ou cria workspace para o usuário.

    Segue a mesma lógica do WorkspaceViewSet.perform_create:
    1. Tenta usar request.workspace (do middleware)
    2. Se não houver, tenta usar user.workspace
    3. Se for super admin e não houver workspace, cria automaticamente
    4. Retorna None se nenhum workspace foi encontrado/criado

    Args:
        request: Request HTTP com user autenticado

    Returns:
        Workspace ou None se não foi possível obter/criar
    """
    from apps.accounts.models import Workspace
    from django.utils.text import slugify
    import logging

    logger = logging.getLogger("apps.bau_mental")

    workspace: "Workspace | None" = getattr(request, "workspace", None)

    # Se não há workspace no request, tentar usar o workspace do usuário
    if not workspace and hasattr(request, "user") and request.user.is_authenticated:
        user = request.user
        if hasattr(user, "workspace") and user.workspace:
            workspace = user.workspace
            logger.debug(f"[get_or_create_workspace] Usando workspace do usuário: {workspace.id} ({workspace.slug})")

    # Se ainda não há workspace e é super admin, criar workspace exclusivo
    if not workspace and hasattr(request, "user") and request.user.is_authenticated:
        user = request.user
        is_superuser = getattr(user, "is_superuser", False)
        if is_superuser:
            user_email = user.email
            workspace_name = f"Super Admin - {user_email}"
            workspace_slug = slugify(f"super-admin-{user_email.split('@')[0]}")

            # Tentar obter workspace existente ou criar novo
            workspace, created = Workspace.objects.get_or_create(
                slug=workspace_slug,
                defaults={
                    "name": workspace_name,
                    "is_active": True,
                    "email": user_email,
                }
            )

            if created:
                logger.info(f"[get_or_create_workspace] Workspace criado automaticamente para super admin: {workspace.id} ({workspace.slug})")
            else:
                logger.debug(f"[get_or_create_workspace] Workspace existente encontrado para super admin: {workspace.id} ({workspace.slug})")

            # Associar workspace ao usuário se não estiver associado
            if hasattr(user, "workspace") and not user.workspace:
                user.workspace = workspace
                user.save(update_fields=["workspace"])
                logger.info(f"[get_or_create_workspace] Workspace associado ao usuário: {workspace.id}")

    return workspace
