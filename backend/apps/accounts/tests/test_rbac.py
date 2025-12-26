"""Testes para sistema RBAC."""

from django.db import IntegrityError
from django.test import TestCase

from apps.accounts.models import User, Workspace, Role
from apps.core.permissions import HasPermission
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView


class RBACTestCase(TestCase):
    """Testes para sistema RBAC."""

    def setUp(self) -> None:
        """Configuração inicial para testes."""
        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace",
            is_active=True,
        )

        self.user = User.objects.create_user(
            email="test@example.com",
            password="test123",
            workspace=self.workspace,
            first_name="Test",
            last_name="User",
        )

        # Criar roles
        self.admin_role = Role.objects.create(
            workspace=self.workspace,
            name="Admin",
            description="Administrador",
            permissions=["*"],
        )

        self.editor_role = Role.objects.create(
            workspace=self.workspace,
            name="Editor",
            description="Editor",
            permissions=["leads.view", "leads.create", "leads.update"],
        )

        self.viewer_role = Role.objects.create(
            workspace=self.workspace,
            name="Viewer",
            description="Visualizador",
            permissions=["leads.view"],
        )

        self.factory = APIRequestFactory()

    def test_user_get_permissions(self) -> None:
        """Testa método get_permissions do User."""
        # Usuário sem roles
        permissions = self.user.get_permissions()
        self.assertEqual(permissions, [])

        # Usuário com role Viewer
        self.user.roles.add(self.viewer_role)
        permissions = self.user.get_permissions()
        self.assertEqual(permissions, ["leads.view"])

        # Usuário com role Editor
        self.user.roles.clear()
        self.user.roles.add(self.editor_role)
        permissions = self.user.get_permissions()
        self.assertIn("leads.view", permissions)
        self.assertIn("leads.create", permissions)
        self.assertIn("leads.update", permissions)

        # Usuário com role Admin (wildcard *)
        self.user.roles.clear()
        self.user.roles.add(self.admin_role)
        permissions = self.user.get_permissions()
        self.assertEqual(permissions, ["*"])

        # Usuário com múltiplas roles
        self.user.roles.add(self.viewer_role)
        permissions = self.user.get_permissions()
        self.assertIn("*", permissions)

    def test_user_get_permissions_with_workspace(self) -> None:
        """Testa get_permissions com workspace específico."""
        # Criar segundo workspace
        workspace2 = Workspace.objects.create(
            name="Workspace 2",
            slug="workspace-2",
            is_active=True,
        )

        # Criar role no segundo workspace
        role2 = Role.objects.create(
            workspace=workspace2,
            name="Admin",
            permissions=["admin.*"],
        )

        # Usuário tem roles em ambos workspaces
        self.user.roles.add(self.viewer_role)  # Workspace 1
        self.user.roles.add(role2)  # Workspace 2

        # Permissões do workspace 1
        permissions1 = self.user.get_permissions(workspace=self.workspace)
        self.assertEqual(permissions1, ["leads.view"])

        # Permissões do workspace 2
        permissions2 = self.user.get_permissions(workspace=workspace2)
        self.assertEqual(permissions2, ["admin.*"])

    def test_superuser_has_all_permissions(self) -> None:
        """Testa que superuser tem todas as permissões."""
        superuser = User.objects.create_superuser(
            email="super@example.com",
            password="super123",
            workspace=self.workspace,
        )

        permissions = superuser.get_permissions()
        self.assertEqual(permissions, ["*"])

    def test_role_permissions(self) -> None:
        """Testa permissões de role."""
        # Verificar permissões do role Admin
        self.assertEqual(self.admin_role.permissions, ["*"])

        # Verificar permissões do role Editor
        self.assertIn("leads.view", self.editor_role.permissions)
        self.assertIn("leads.create", self.editor_role.permissions)
        self.assertIn("leads.update", self.editor_role.permissions)

        # Verificar permissões do role Viewer
        self.assertEqual(self.viewer_role.permissions, ["leads.view"])

    def test_has_permission_class(self) -> None:
        """Testa permission class HasPermission."""
        permission = HasPermission()

        # Criar view mock com required_permission
        class MockView(APIView):
            required_permission = "leads.view"

        view = MockView()

        # Usuário sem permissão
        request = self.factory.get("/")
        request.user = self.user
        request.workspace = self.workspace
        self.assertFalse(permission.has_permission(request, view))

        # Usuário com permissão exata
        self.user.roles.add(self.viewer_role)
        self.assertTrue(permission.has_permission(request, view))

        # Usuário com wildcard
        self.user.roles.clear()
        self.user.roles.add(self.admin_role)
        self.assertTrue(permission.has_permission(request, view))

    def test_wildcard_permissions(self) -> None:
        """Testa wildcards em permissões."""
        permission = HasPermission()

        # Criar role com wildcard por módulo
        module_role = Role.objects.create(
            workspace=self.workspace,
            name="Leads Manager",
            permissions=["leads.*"],
        )

        self.user.roles.add(module_role)

        class MockView(APIView):
            required_permission = "leads.view"

        view = MockView()
        request = self.factory.get("/")
        request.user = self.user
        request.workspace = self.workspace

        # Wildcard "leads.*" deve permitir "leads.view"
        self.assertTrue(permission.has_permission(request, view))

        # Wildcard "leads.*" deve permitir "leads.create"
        view.required_permission = "leads.create"
        self.assertTrue(permission.has_permission(request, view))

        # Wildcard "leads.*" NÃO deve permitir "admin.view"
        view.required_permission = "admin.view"
        self.assertFalse(permission.has_permission(request, view))

    def test_has_permission_without_required_permission(self) -> None:
        """Testa que HasPermission permite acesso se required_permission não especificado."""
        permission = HasPermission()

        class MockView(APIView):
            # Sem required_permission
            pass

        view = MockView()
        request = self.factory.get("/")
        request.user = self.user
        request.workspace = self.workspace

        # Deve permitir (compatibilidade)
        self.assertTrue(permission.has_permission(request, view))

    def test_role_unique_together(self) -> None:
        """Testa que não pode ter dois roles com mesmo nome no mesmo workspace."""
        from django.db import transaction

        # Criar role com mesmo nome no mesmo workspace deve falhar
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                Role.objects.create(
                    workspace=self.workspace,
                    name="Admin",  # Mesmo nome
                    permissions=["leads.view"],
                )

        # Mas pode ter mesmo nome em workspaces diferentes
        workspace2 = Workspace.objects.create(
            name="Workspace 2",
            slug="workspace-2",
            is_active=True,
        )
        role2 = Role.objects.create(
            workspace=workspace2,
            name="Admin",  # Mesmo nome, workspace diferente
            permissions=["leads.view"],
        )
        self.assertIsNotNone(role2)

