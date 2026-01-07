"""App config for supbrainnote."""

from django.apps import AppConfig


class SupbrainnoteConfig(AppConfig):
    """Configuração do app supbrainnote."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.supbrainnote"
    verbose_name = "SupBrainNote"

    def ready(self) -> None:
        """Importa signals quando app está pronto."""
        import apps.supbrainnote.signals  # noqa: F401

