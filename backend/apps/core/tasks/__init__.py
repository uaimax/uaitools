"""Tasks assíncronas do app core."""

# Importar tasks aqui para que sejam descobertas automaticamente pelo Celery
from apps.core.tasks.example import example_task  # noqa: F401

__all__ = ["example_task"]




