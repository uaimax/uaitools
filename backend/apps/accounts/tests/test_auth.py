"""Testes para autenticação."""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Workspace

User = get_user_model()


class AuthenticationTestCase(TestCase):
    """Testes para endpoints de autenticação."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
            first_name="Test",
            last_name="User",
        )

    def test_login_success(self) -> None:
        """Testa login bem-sucedido."""
        response = self.client.post(
            "/api/auth/login/",
            {"email": "test@example.com", "password": "testpass123"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user", response.json())
        self.assertEqual(response.json()["user"]["email"], "test@example.com")

    def test_login_invalid_credentials(self) -> None:
        """Testa login com credenciais inválidas."""
        response = self.client.post(
            "/api/auth/login/",
            {"email": "test@example.com", "password": "wrongpass"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout(self) -> None:
        """Testa logout."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_register_success_with_workspace_slug(self) -> None:
        """Testa registro bem-sucedido com workspace_slug (convite)."""
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "newuser@example.com",
                "password": "newpass123",
                "password_confirm": "newpass123",
                "workspace_slug": self.workspace.slug,
                "accepted_terms": True,
                "accepted_privacy": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", response.json())
        user = User.objects.get(email="newuser@example.com")
        self.assertEqual(user.workspace, self.workspace)

    def test_register_success_auto_create_workspace(self) -> None:
        """Testa registro bem-sucedido com criação automática de Workspace."""
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "newuser@example.com",
                "password": "newpass123",
                "password_confirm": "newpass123",
                "first_name": "New",
                "last_name": "User",
                "accepted_terms": True,
                "accepted_privacy": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", response.json())
        user = User.objects.get(email="newuser@example.com")
        self.assertIsNotNone(user.workspace)
        self.assertEqual(user.workspace.name, "Workspace de New User")
        self.assertTrue(user.workspace.slug.startswith("workspace-de-new-user"))

    def test_register_success_with_workspace_name(self) -> None:
        """Testa registro bem-sucedido com workspace_name personalizado."""
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "newuser@example.com",
                "password": "newpass123",
                "password_confirm": "newpass123",
                "first_name": "New",
                "last_name": "User",
                "workspace_name": "Meu Workspace Personalizado",
                "accepted_terms": True,
                "accepted_privacy": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", response.json())
        user = User.objects.get(email="newuser@example.com")
        self.assertIsNotNone(user.workspace)
        self.assertEqual(user.workspace.name, "Meu Workspace Personalizado")
        self.assertTrue(user.workspace.slug.startswith("meu-workspace-personalizado"))

    def test_register_password_mismatch(self) -> None:
        """Testa registro com senhas que não coincidem."""
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "newuser@example.com",
                "password": "newpass123",
                "password_confirm": "differentpass",
                "accepted_terms": True,
                "accepted_privacy": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_requires_auth(self) -> None:
        """Testa que perfil requer autenticação."""
        response = self.client.get("/api/auth/profile/")
        # DRF pode retornar 401 (Unauthorized) ou 403 (Forbidden) dependendo da configuração
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_profile_authenticated(self) -> None:
        """Testa obtenção de perfil autenticado."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["email"], "test@example.com")

    def test_update_profile(self) -> None:
        """Testa atualização de perfil."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            "/api/auth/profile/update/",
            {"first_name": "Updated", "last_name": "Name"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")
        self.assertEqual(self.user.last_name, "Name")

    def test_workspaces_list(self) -> None:
        """Testa listagem de workspaces."""
        response = self.client.get("/api/workspaces/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.json(), list)

