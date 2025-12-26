"""Development settings.

SQLite database, DEBUG=True, CORS permissivo.
"""

from .base import *  # noqa: F403, F401

DEBUG = True

# ALLOWED_HOSTS configurável via env (lista separada por vírgula)
# Default inclui localhost para desenvolvimento
ALLOWED_HOSTS_ENV = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,*")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_ENV.split(",") if host.strip()]

# Database - SQLite para desenvolvimento
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

