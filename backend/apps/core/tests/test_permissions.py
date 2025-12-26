"""Testes para permissões de segurança multi-tenant."""

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.accounts.models import Workspace, User
from apps.core.models import BaseModel
from apps.core.permissions import WorkspaceObjectPermission
from apps.leads.models import Lead


class WorkspaceObjectPermissionTestCase(TestCase):
    """Testes para WorkspaceObjectPermission."""

    def setUp(self):
        """Configuração inicial."""
        self.factory = APIRequestFactory()
        self.permission = WorkspaceObjectPermission()

        # Criar dois workspaces
        self.workspace1 = Workspace.objects.create(
            name="Workspace 1",
            slug="workspace-1",
            is_active=True,
        )
        self.workspace2 = Workspace.objects.create(
            name="Workspace 2",
            slug="workspace-2",
            is_active=True,
        )

        # Criar usuários
        self.user1 = User.objects.create_user(
            email="user1@workspace1.com",
            password="testpass123",
            workspace=self.workspace1,
        )
        self.user2 = User.objects.create_user(
            email="user2@workspace2.com",
            password="testpass123",
            workspace=self.workspace2,
        )

        # Criar leads para cada workspace
        self.lead1 = Lead.objects.create(
            workspace=self.workspace1,
            name="Lead 1",
            email="lead1@example.com",
        )
        self.lead2 = Lead.objects.create(
            workspace=self.workspace2,
            name="Lead 2",
            email="lead2@example.com",
        )

    def test_permite_acesso_quando_objeto_pertence_ao_workspace(self):
        """Testa que usuário pode acessar objeto de seu próprio workspace."""
        request = self.factory.get("/")
        request.workspace = self.workspace1
        request.user = self.user1

        # Usuário do workspace1 pode acessar lead1 (mesmo workspace)
        self.assertTrue(
            self.permission.has_object_permission(request, None, self.lead1)
        )

    def test_nega_acesso_quando_objeto_pertence_a_outro_workspace(self):
        """Testa que usuário NÃO pode acessar objeto de outro workspace."""
        request = self.factory.get("/")
        request.workspace = self.workspace1
        request.user = self.user1

        # Usuário do workspace1 NÃO pode acessar lead2 (workspace diferente)
        self.assertFalse(
            self.permission.has_object_permission(request, None, self.lead2)
        )

    def test_nega_acesso_quando_objeto_não_tem_workspace(self):
        """Testa que objeto sem workspace é negado."""
        # Criar objeto mock sem atributo workspace
        from unittest.mock import Mock

        obj_sem_workspace = Mock()
        # Não definir atributo 'workspace' no objeto

        request = self.factory.get("/")
        request.workspace = self.workspace1
        request.user = self.user1

        self.assertFalse(
            self.permission.has_object_permission(request, None, obj_sem_workspace)
        )

    def test_nega_acesso_quando_request_não_tem_workspace(self):
        """Testa que request sem workspace é negado."""
        request = self.factory.get("/")
        request.user = self.user1
        # request.workspace não definido

        self.assertFalse(
            self.permission.has_object_permission(request, None, self.lead1)
        )

    def test_has_permission_sempre_retorna_true(self):
        """Testa que has_permission sempre permite (validação é em has_object_permission)."""
        request = self.factory.get("/")
        request.user = self.user1

        # has_permission deve sempre retornar True
        # A validação real é feita em has_object_permission
        self.assertTrue(self.permission.has_permission(request, None))

