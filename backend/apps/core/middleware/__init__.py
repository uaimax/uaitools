"""Middlewares customizados para o projeto."""

# Importar middlewares do módulo middleware/
from .base import (
    ErrorLoggingMiddleware,
    UUIDSessionMiddleware,
    WorkspaceMiddleware,
)
from .csrf_debug import CsrfDebugMiddleware

__all__ = [
    "ErrorLoggingMiddleware",
    "UUIDSessionMiddleware",
    "WorkspaceMiddleware",
    "CsrfDebugMiddleware",
]
