"""Production settings.

PostgreSQL via DATABASE_URL, DEBUG=False, security headers.
CSRF desabilitado temporariamente.
"""

import os
import logging
from urllib.parse import urlparse

from .base import *  # noqa: F403, F401

logger = logging.getLogger("django")

DEBUG = os.environ.get("DEBUG", "False") == "True"

# ALLOWED_HOSTS - usa wildcard se não configurado
ALLOWED_HOSTS_ENV = os.environ.get("ALLOWED_HOSTS", "*")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_ENV.split(",") if host.strip()]
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["*"]

logger.info(f"[PROD] ALLOWED_HOSTS: {ALLOWED_HOSTS}")
logger.info(f"[PROD] CSRF desabilitado (CsrfViewMiddleware removido)")

# Database - PostgreSQL via DATABASE_URL (ou SQLite para build)
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.strip():
    from urllib.parse import unquote

    parsed = urlparse(DATABASE_URL)
    password = unquote(parsed.password) if parsed.password else ""

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path[1:],
            "USER": parsed.username,
            "PASSWORD": password,
            "HOST": parsed.hostname,
            "PORT": parsed.port or 5432,
        }
    }
else:
    logger.warning("⚠️ DATABASE_URL não configurado - usando SQLite")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

# Security settings (relaxados temporariamente)
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_USE_SESSIONS = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "SAMEORIGIN"
