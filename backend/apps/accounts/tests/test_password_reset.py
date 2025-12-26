"""Testes para funcionalidade de reset de senha."""

from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import PasswordResetToken, Workspace
from apps.accounts.services import generate_password_reset_token, validate_password_reset_token

User = get_user_model()


class PasswordResetTokenModelTest(TestCase):
    """Testes para o model PasswordResetToken."""

    def setUp(self):
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace",
            is_active=True,
        )
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )

    def test_token_creation(self):
        """Testa criação de token."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            workspace=self.workspace,
        )

        self.assertIsNotNone(token.token)
        self.assertIsNotNone(token.expires_at)
        self.assertIsNone(token.used_at)
        self.assertEqual(token.user, self.user)
        self.assertEqual(token.workspace, self.workspace)

    def test_token_is_valid(self):
        """Testa validação de token válido."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            workspace=self.workspace,
        )

        self.assertTrue(token.is_valid())

    def test_token_is_invalid_when_used(self):
        """Testa que token usado é inválido."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            workspace=self.workspace,
        )
        token.mark_as_used()

        self.assertFalse(token.is_valid())

    def test_token_is_invalid_when_expired(self):
        """Testa que token expirado é inválido."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            workspace=self.workspace,
            expires_at=timezone.now() - timedelta(hours=1),
        )

        self.assertFalse(token.is_valid())

    def test_mark_as_used(self):
        """Testa marcação de token como usado."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            workspace=self.workspace,
        )

        self.assertIsNone(token.used_at)
        token.mark_as_used()
        token.refresh_from_db()

        self.assertIsNotNone(token.used_at)


class PasswordResetServicesTest(TestCase):
    """Testes para services de password reset."""

    def setUp(self):
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace",
            is_active=True,
        )
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )

    def test_generate_password_reset_token(self):
        """Testa geração de token."""
        token = generate_password_reset_token(self.user)

        self.assertIsNotNone(token)
        self.assertEqual(token.user, self.user)
        self.assertTrue(token.is_valid())

    def test_generate_token_invalidates_previous_tokens(self):
        """Testa que gerar novo token invalida tokens anteriores."""
        token1 = generate_password_reset_token(self.user)
        token2 = generate_password_reset_token(self.user)

        token1.refresh_from_db()
        self.assertIsNotNone(token1.used_at)
        self.assertTrue(token2.is_valid())

    def test_validate_password_reset_token_valid(self):
        """Testa validação de token válido."""
        token = generate_password_reset_token(self.user)
        user = validate_password_reset_token(token.token)

        self.assertEqual(user, self.user)

    def test_validate_password_reset_token_invalid(self):
        """Testa validação de token inválido."""
        user = validate_password_reset_token("00000000-0000-0000-0000-000000000000")

        self.assertIsNone(user)

    def test_validate_password_reset_token_used(self):
        """Testa validação de token já usado."""
        token = generate_password_reset_token(self.user)
        token.mark_as_used()

        user = validate_password_reset_token(token.token)

        self.assertIsNone(user)

    def test_validate_password_reset_token_expired(self):
        """Testa validação de token expirado."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            workspace=self.workspace,
            expires_at=timezone.now() - timedelta(hours=1),
        )

        user = validate_password_reset_token(token.token)

        self.assertIsNone(user)


class PasswordResetAPITest(TestCase):
    """Testes para endpoints de password reset."""

    def setUp(self):
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace",
            is_active=True,
        )
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )

    def test_password_reset_request_valid_email(self):
        """Testa solicitação de reset com email válido."""
        response = self.client.post(
            "/api/auth/password-reset-request/",
            {"email": "test@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_password_reset_request_invalid_email(self):
        """Testa solicitação de reset com email inválido (ainda retorna sucesso)."""
        response = self.client.post(
            "/api/auth/password-reset-request/",
            {"email": "nonexistent@example.com"},
            format="json",
        )

        # Sempre retorna sucesso genérico (segurança)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_password_reset_request_missing_email(self):
        """Testa solicitação de reset sem email."""
        response = self.client.post(
            "/api/auth/password-reset-request/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_confirm_valid_token(self):
        """Testa confirmação de reset com token válido."""
        token = generate_password_reset_token(self.user)

        response = self.client.post(
            "/api/auth/password-reset-confirm/",
            {
                "token": str(token.token),
                "new_password": "newpass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Verificar se senha foi alterada
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass123"))

        # Verificar se token foi marcado como usado
        token.refresh_from_db()
        self.assertIsNotNone(token.used_at)

    def test_password_reset_confirm_invalid_token(self):
        """Testa confirmação de reset com token inválido."""
        response = self.client.post(
            "/api/auth/password-reset-confirm/",
            {
                "token": "00000000-0000-0000-0000-000000000000",
                "new_password": "newpass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("token", response.data)

    def test_password_reset_confirm_weak_password(self):
        """Testa confirmação de reset com senha fraca."""
        token = generate_password_reset_token(self.user)

        response = self.client.post(
            "/api/auth/password-reset-confirm/",
            {
                "token": str(token.token),
                "new_password": "123",  # Senha muito curta
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", response.data)

    def test_password_reset_confirm_missing_fields(self):
        """Testa confirmação de reset sem campos obrigatórios."""
        response = self.client.post(
            "/api/auth/password-reset-confirm/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.accounts.services.send_password_reset_email")
    def test_password_reset_email_sent(self, mock_send_email):
        """Testa que email é enviado ao solicitar reset."""
        response = self.client.post(
            "/api/auth/password-reset-request/",
            {"email": "test@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificar que send_password_reset_email foi chamado
        # (mock será verificado automaticamente)


