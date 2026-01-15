"""App config for bau_mental."""

from django.apps import AppConfig


class BauMentalConfig(AppConfig):
    """Configuração do app bau_mental."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.bau_mental"
    verbose_name = "bau_mental"

    def ready(self) -> None:
        """Importa signals quando app está pronto."""
        import apps.bau_mental.signals  # noqa: F401

