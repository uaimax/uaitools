"""Accounts app - User and Tenant models."""

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuration for accounts app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"

    def ready(self):
        """Importa signals quando o app estiver pronto."""
        import apps.accounts.signals  # noqa: F401

