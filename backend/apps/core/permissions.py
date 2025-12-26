"""Permissões customizadas para segurança multi-tenant."""

from rest_framework.permissions import BasePermission


class HasPermission(BasePermission):
    """Verifica se usuário tem permissão específica.

    Uso:
        class MyViewSet(WorkspaceViewSet):
            permission_classes = [IsAuthenticated, HasPermission]
            required_permission = "leads.view"  # Para toda a view
    """

    def has_permission(self, request, view) -> bool:
        """Verifica permissão na view."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers têm todas as permissões
        if getattr(request.user, "is_superuser", False):
            return True

        # Obter permissão requerida da view
        required_permission = getattr(view, "required_permission", None)
        if not required_permission:
            # Se não especificado, permitir (compatibilidade)
            return True

        # Obter permissões do usuário
        workspace = getattr(request, "workspace", None)
        user_permissions = request.user.get_permissions(workspace=workspace)

        # Verificar permissão (suporta wildcards)
        return self._check_permission(user_permissions, required_permission)

    def _check_permission(self, user_permissions: list[str], required: str) -> bool:
        """Verifica se permissão está na lista (suporta wildcards)."""
        # Permissão exata
        if required in user_permissions:
            return True

        # Wildcard "*" = todas as permissões
        if "*" in user_permissions:
            return True

        # Wildcard por módulo (ex: "leads.*" permite "leads.view", "leads.create")
        for perm in user_permissions:
            if perm.endswith(".*"):
                prefix = perm[:-2]  # Remove ".*"
                if required.startswith(prefix + "."):
                    return True

        return False


class WorkspaceObjectPermission(BasePermission):
    """Valida que objeto pertence ao workspace do request.

    Previne IDOR (Insecure Direct Object Reference) garantindo que
    usuários só possam acessar recursos de seu próprio workspace.

    Uso:
        class MyViewSet(WorkspaceViewSet):
            permission_classes = [IsAuthenticated, WorkspaceObjectPermission]
    """

    def has_object_permission(self, request, view, obj) -> bool:
        """Verifica se o objeto pertence ao workspace do request.

        Super admins (is_superuser=True) têm acesso a todos os objetos.
        """
        # Verificar se usuário está autenticado
        if not request.user or not request.user.is_authenticated:
            return False

        # Super admins têm acesso a todos os objetos
        # Verifica tanto is_superuser quanto has_attr para garantir compatibilidade
        is_superuser = (
            getattr(request.user, "is_superuser", False)
            or (hasattr(request.user, "is_superuser") and request.user.is_superuser)
        )
        if is_superuser:
            return True

        # Se objeto não tem workspace, negar acesso
        if not hasattr(obj, "workspace"):
            return False

        # Obter workspace do request (definida pelo middleware)
        request_workspace = getattr(request, "workspace", None)
        if not request_workspace:
            # Se não há workspace no request, negar acesso
            return False

        # Comparar IDs (suporta UUID e inteiros)
        return obj.workspace_id == request_workspace.id

    def has_permission(self, request, view) -> bool:
        """Permite acesso à view (validação de objeto é feita em has_object_permission)."""
        # Esta permissão valida ownership, não permissão de acesso geral
        # A permissão de autenticação (IsAuthenticated) deve ser aplicada separadamente
        return True

