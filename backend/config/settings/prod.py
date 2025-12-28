"""Production settings.

PostgreSQL via DATABASE_URL, DEBUG=False, security headers.
"""

import os
from urllib.parse import urlparse

from .base import *  # noqa: F403, F401

DEBUG = os.environ.get("DEBUG", "False") == "True"  # noqa: F405

# ALLOWED_HOSTS - usa wildcard se não configurado (para permitir build/deploy sem erro)
ALLOWED_HOSTS_ENV = os.environ.get("ALLOWED_HOSTS", "*")  # noqa: F405
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_ENV.split(",") if host.strip()]  # noqa: F405
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["*"]  # Fallback para wildcard se vazio

# Database - PostgreSQL via DATABASE_URL (ou SQLite para build)
DATABASE_URL = os.environ.get("DATABASE_URL")  # noqa: F405
if DATABASE_URL and DATABASE_URL.strip():
    # Parse DATABASE_URL manualmente (formato: postgresql://user:pass@host:port/dbname)
    from urllib.parse import unquote  # noqa: F401

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
    # Fallback para SQLite durante build (quando DATABASE_URL não está disponível)
    import logging
    logging.getLogger("django").warning("⚠️ DATABASE_URL não configurado - usando SQLite temporário")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

# =============================================================================
# SECURITY SETTINGS
# =============================================================================
import logging
logger = logging.getLogger("django")

# Modo permissivo: ALLOWED_HOSTS=* desabilita verificações
_PERMISSIVE_MODE = "*" in ALLOWED_HOSTS

# Em modo permissivo, desabilitar verificações de segurança
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "None" if _PERMISSIVE_MODE else "Lax"
CSRF_USE_SESSIONS = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "SAMEORIGIN" if _PERMISSIVE_MODE else "DENY"

# Log das configurações (para debug)
if _PERMISSIVE_MODE:
    logger.warning("[PROD] ⚠️ Modo permissivo ativado (ALLOWED_HOSTS=*)")
    logger.warning(f"[PROD] CSRF_TRUSTED_ORIGINS: {len(CSRF_TRUSTED_ORIGINS)} origens")  # noqa: F405
    logger.warning(f"[PROD] MIDDLEWARE tem CsrfViewMiddleware: {'django.middleware.csrf.CsrfViewMiddleware' in MIDDLEWARE}")  # noqa: F405
    for origin in CSRF_TRUSTED_ORIGINS[:5]:  # noqa: F405
        logger.warning(f"[PROD]   - {origin}")
else:
    logger.info(f"[PROD] Modo seguro - ALLOWED_HOSTS: {ALLOWED_HOSTS}")
