"""Testes para ViewSets base."""

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Workspace, User
from apps.core.models import WorkspaceModel
from apps.core.viewsets import WorkspaceViewSet
from django.db import models


# Model de teste que herda WorkspaceModel
# Nota: Este model não será criado no banco, apenas usado para testes
class MockWorkspaceModel(WorkspaceModel):
    """Model mock para validar WorkspaceViewSet."""

    name = models.CharField(max_length=100)

    class Meta:
        app_label = "core"
        # Não criar tabela no banco
        managed = False


# ViewSet de teste
class MockWorkspaceViewSet(WorkspaceViewSet):
    """ViewSet mock para testes."""

    queryset = MockWorkspaceModel.objects.all()


class WorkspaceViewSetTestCase(TestCase):
    """Testes para WorkspaceViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace1 = Workspace.objects.create(name="Workspace 1", slug="workspace-1")
        self.workspace2 = Workspace.objects.create(name="Workspace 2", slug="workspace-2")
        self.user1 = User.objects.create_user(
            email="user1@test.com", password="pass", workspace=self.workspace1
        )

    def test_viewset_filters_by_workspace(self) -> None:
        """Testa que ViewSet filtra por workspace automaticamente."""
        # Usar Lead como modelo de teste real (já que MockWorkspaceModel não tem tabela)
        from apps.leads.models import Lead
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request

        obj1 = Lead.objects.create(name="Obj 1", workspace=self.workspace1, email="obj1@test.com")
        obj2 = Lead.objects.create(name="Obj 2", workspace=self.workspace2, email="obj2@test.com")

        # Criar ViewSet para Lead com request real do DRF
        from apps.leads.viewsets import LeadViewSet
        factory = APIRequestFactory()
        wsgi_request = factory.get("/api/leads/", HTTP_X_WORKSPACE_ID=self.workspace1.slug)
        request = Request(wsgi_request)  # Converter para Request do DRF
        request.workspace = self.workspace1  # Simular middleware

        viewset = LeadViewSet()
        viewset.request = request
        viewset.action = "list"

        queryset = viewset.get_queryset()
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first(), obj1)


    def test_viewset_perform_create_sets_workspace(self) -> None:
        """Testa que perform_create define workspace automaticamente."""
        from apps.leads.viewsets import LeadViewSet
        from apps.leads.serializers import LeadSerializer

        viewset = LeadViewSet()
        viewset.request = type("Request", (), {"workspace": self.workspace1})()

        # Mock serializer
        class MockSerializer:
            def save(self, workspace=None):
                self.workspace = workspace

        serializer = MockSerializer()
        viewset.perform_create(serializer)

        self.assertEqual(serializer.workspace, self.workspace1)

