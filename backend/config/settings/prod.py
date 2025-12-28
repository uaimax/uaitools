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

# Security settings para prod
# Se ALLOWED_HOSTS=* (modo permissivo), desabilitar proteções SSL/CSRF
_PERMISSIVE_MODE = "*" in ALLOWED_HOSTS  # noqa: F405

SECURE_SSL_REDIRECT = False if _PERMISSIVE_MODE else not DEBUG
SESSION_COOKIE_SECURE = False if _PERMISSIVE_MODE else not DEBUG
CSRF_COOKIE_SECURE = False if _PERMISSIVE_MODE else not DEBUG
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_USE_SESSIONS = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# CSRF Trusted Origins - configuração simplificada
import logging
logger = logging.getLogger("django")

CSRF_TRUSTED_ORIGINS_ENV = os.environ.get("CSRF_TRUSTED_ORIGINS", "").strip()

if CSRF_TRUSTED_ORIGINS_ENV:
    # Usar lista da variável de ambiente
    CSRF_TRUSTED_ORIGINS = [
        origin.strip().rstrip("/")
        for origin in CSRF_TRUSTED_ORIGINS_ENV.split(",")
        if origin.strip()
    ]
    logger.info(f"[CSRF] Origens configuradas via env: {CSRF_TRUSTED_ORIGINS}")
elif _PERMISSIVE_MODE:
    # Modo permissivo: ALLOWED_HOSTS=* - desabilitar CSRF completamente
    # IMPORTANTE: Redefinir MIDDLEWARE completamente (não usar .remove())
    # Isso garante que funciona em todos os workers do Gunicorn
    CSRF_TRUSTED_ORIGINS = []
    logger.warning("[CSRF] ⚠️ ALLOWED_HOSTS=* - CSRF DESABILITADO (modo permissivo)")
    logger.warning("[CSRF] ⚠️ Configure CSRF_TRUSTED_ORIGINS para produção segura")

    # Redefinir MIDDLEWARE sem os middlewares CSRF
    MIDDLEWARE = [  # noqa: F405
        "django.middleware.security.SecurityMiddleware",
        "whitenoise.middleware.WhiteNoiseMiddleware",
        "corsheaders.middleware.CorsMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.locale.LocaleMiddleware",
        "apps.core.middleware.UUIDSessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        # CSRF middlewares REMOVIDOS em modo permissivo
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "allauth.account.middleware.AccountMiddleware",
        "apps.core.middleware.WorkspaceMiddleware",
        "apps.core.middleware.ErrorLoggingMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
    ]
    logger.warning("[CSRF] ⚠️ MIDDLEWARE redefinido SEM CsrfViewMiddleware")
else:
    # Derivar de ALLOWED_HOSTS (adicionar https://)
    CSRF_TRUSTED_ORIGINS = [
        f"https://{host}"
        for host in ALLOWED_HOSTS  # noqa: F405
        if host not in ("localhost", "127.0.0.1", "*")
    ]
    logger.info(f"[CSRF] Origens derivadas de ALLOWED_HOSTS: {CSRF_TRUSTED_ORIGINS}")

