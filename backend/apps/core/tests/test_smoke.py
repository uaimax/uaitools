"""Smoke tests para validar que o servidor inicia corretamente."""

from django.conf import settings
from django.test import TestCase

from apps.accounts.models import Workspace, User
from apps.core.middleware import WorkspaceMiddleware


class SmokeTestCase(TestCase):
    """Testes basicos de smoke para validar setup."""

    def test_django_is_configured(self) -> None:
        """Testa se Django esta configurado corretamente."""
        self.assertTrue(settings.SECRET_KEY)
        self.assertEqual(settings.ROOT_URLCONF, "config.urls")
        self.assertEqual(settings.AUTH_USER_MODEL, "accounts.User")

    def test_admin_url_exists(self) -> None:
        """Testa se a URL do admin existe."""
        from django.conf import settings
        admin_prefix = getattr(settings, "ADMIN_URL_PREFIX", "manage")
        response = self.client.get(f"/{admin_prefix}/")
        self.assertIn(response.status_code, [200, 302])  # 302 = redirect para login

    def test_jazzmin_is_installed(self) -> None:
        """Testa se Jazzmin esta instalado e configurado."""
        self.assertIn("jazzmin", settings.INSTALLED_APPS)
        self.assertTrue(hasattr(settings, "JAZZMIN_SETTINGS"))
        self.assertTrue(hasattr(settings, "JAZZMIN_UI_TWEAKS"))

    def test_middleware_is_configured(self) -> None:
        """Testa se WorkspaceMiddleware esta configurado."""
        self.assertIn("apps.core.middleware.WorkspaceMiddleware", settings.MIDDLEWARE)

    def test_models_can_be_imported(self) -> None:
        """Testa se models principais podem ser importados."""
        self.assertIsNotNone(Workspace)
        self.assertIsNotNone(User)

    def test_middleware_can_be_instantiated(self) -> None:
        """Testa se middleware pode ser instanciado."""
        middleware = WorkspaceMiddleware(lambda request: None)
        self.assertIsNotNone(middleware)

