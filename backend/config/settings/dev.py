"""Development settings.

SQLite database (fallback) ou PostgreSQL via DATABASE_URL, DEBUG=True, CORS permissivo.
"""

import os
from urllib.parse import urlparse

from .base import *  # noqa: F403, F401

DEBUG = True

# ALLOWED_HOSTS configurável via env (lista separada por vírgula)
# Default inclui localhost para desenvolvimento
ALLOWED_HOSTS_ENV = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,*")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_ENV.split(",") if host.strip()]

# Database - PostgreSQL via DATABASE_URL se disponível, senão SQLite
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    # Parse DATABASE_URL manualmente (formato: postgresql://user:pass@host:port/dbname)
    from urllib.parse import unquote

    parsed = urlparse(DATABASE_URL)
    # Decodifica a senha (ex: %40 vira @)
    password = unquote(parsed.password) if parsed.password else ""

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path[1:],  # Remove leading /
            "USER": parsed.username,
            "PASSWORD": password,  # Senha decodificada
            "HOST": parsed.hostname,
            "PORT": parsed.port or 5432,
        }
    }
else:
    # Fallback para SQLite em desenvolvimento
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

# Security settings para dev
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
# Permitir cookies em requisições cross-origin
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
# CSRF Trusted Origins - permite requisições do frontend
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

