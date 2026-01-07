"""Tasks assíncronas do app core."""

# Importar tasks aqui para que sejam descobertas automaticamente pelo Celery
from apps.core.tasks.example import example_task  # noqa: F401
from apps.core.tasks.logging import cleanup_old_logs  # noqa: F401

__all__ = ["example_task", "cleanup_old_logs"]




