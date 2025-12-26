"""Testes para middleware de multi-tenancy."""

from django.test import RequestFactory, TestCase

from apps.accounts.models import Workspace, User
from apps.core.middleware import WorkspaceMiddleware


class WorkspaceMiddlewareTestCase(TestCase):
    """Testes para WorkspaceMiddleware."""

    def setUp(self) -> None:
        """Configuração inicial para os testes."""
        self.factory = RequestFactory()
        self.middleware = WorkspaceMiddleware(lambda request: None)
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace")

    def test_middleware_sets_workspace_from_header(self) -> None:
        """Testa que middleware define workspace quando header existe."""
        request = self.factory.get("/", HTTP_X_WORKSPACE_ID="test-workspace")
        self.middleware(request)

        self.assertIsNotNone(request.workspace)
        self.assertEqual(request.workspace.slug, "test-workspace")
        self.assertEqual(request.workspace, self.workspace)

    def test_middleware_sets_none_when_header_missing(self) -> None:
        """Testa que middleware define None quando header não existe."""
        request = self.factory.get("/")
        self.middleware(request)

        self.assertIsNone(request.workspace)

    def test_middleware_sets_none_when_workspace_not_found(self) -> None:
        """Testa que middleware define None quando workspace não existe."""
        request = self.factory.get("/", HTTP_X_WORKSPACE_ID="inexistente")
        self.middleware(request)

        self.assertIsNone(request.workspace)

    def test_middleware_ignores_inactive_workspaces(self) -> None:
        """Testa que middleware ignora workspaces inativos."""
        inactive_workspace = Workspace.objects.create(
            name="Inactive Workspace", slug="inactive-workspace", is_active=False
        )

        request = self.factory.get("/", HTTP_X_WORKSPACE_ID="inactive-workspace")
        self.middleware(request)

        self.assertIsNone(request.workspace)

    def test_middleware_handles_empty_header(self) -> None:
        """Testa que middleware lida com header vazio."""
        request = self.factory.get("/")
        self.middleware(request)

        self.assertIsNone(request.workspace)

    def test_middleware_rejects_invalid_slug_format(self) -> None:
        """Testa que middleware rejeita slugs com formato inválido."""
        # Testar vários formatos inválidos
        invalid_slugs = [
            "Workspace-Name",  # Maiúsculas
            "workspace_name",  # Underscore
            "workspace@name",  # Caracteres especiais
            "workspace name",  # Espaços
            "workspace.name",  # Ponto
            "../../etc/passwd",  # Path traversal
            "<script>",  # XSS attempt
        ]

        for invalid_slug in invalid_slugs:
            request = self.factory.get("/", HTTP_X_WORKSPACE_ID=invalid_slug)
            self.middleware(request)
            self.assertIsNone(
                request.workspace,
                f"Slug '{invalid_slug}' deveria ser rejeitado",
            )

    def test_middleware_accepts_valid_slug_format(self) -> None:
        """Testa que middleware aceita slugs com formato válido."""
        # Criar workspace com slug válido
        valid_workspace = Workspace.objects.create(
            name="Valid Workspace", slug="valid-workspace-123", is_active=True
        )

        request = self.factory.get("/", HTTP_X_WORKSPACE_ID="valid-workspace-123")
        self.middleware(request)

        self.assertIsNotNone(request.workspace)
        self.assertEqual(request.workspace, valid_workspace)
        request = self.factory.get("/", HTTP_X_WORKSPACE_ID="")
        self.middleware(request)

        self.assertIsNone(request.workspace)

    def test_middleware_handles_whitespace_in_header(self) -> None:
        """Testa que middleware remove espaços em branco do header."""
        request = self.factory.get("/", HTTP_X_WORKSPACE_ID="  test-workspace  ")
        self.middleware(request)

        self.assertIsNotNone(request.workspace)
        self.assertEqual(request.workspace.slug, "test-workspace")

