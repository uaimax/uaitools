"""Core app configuration."""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Configuration for core app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"

    def ready(self) -> None:
        """Importa signals quando app está pronto."""
        import apps.core.signals  # noqa: F401




