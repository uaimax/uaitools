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
# CSRF - CONFIGURAÇÃO AGRESSIVA
# =============================================================================
import logging
logger = logging.getLogger("django")

# Modo permissivo: ALLOWED_HOSTS=* desabilita verificações
_PERMISSIVE_MODE = "*" in ALLOWED_HOSTS

# Em modo permissivo, desabilitar TODAS as verificações de segurança
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "None" if _PERMISSIVE_MODE else "Lax"
CSRF_USE_SESSIONS = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "SAMEORIGIN" if _PERMISSIVE_MODE else "DENY"

# CSRF_TRUSTED_ORIGINS - CONFIGURAÇÃO AGRESSIVA
# Quando ALLOWED_HOSTS=*, aceitar QUALQUER origem
CSRF_TRUSTED_ORIGINS_ENV = os.environ.get("CSRF_TRUSTED_ORIGINS", "").strip()

if CSRF_TRUSTED_ORIGINS_ENV:
    # Usar lista da variável de ambiente
    CSRF_TRUSTED_ORIGINS = [
        origin.strip().rstrip("/")
        for origin in CSRF_TRUSTED_ORIGINS_ENV.split(",")
        if origin.strip()
    ]
    logger.info(f"[CSRF] Origens configuradas via env: {CSRF_TRUSTED_ORIGINS}")
else:
    # MODO PERMISSIVO: Adicionar TODAS as origens possíveis
    # Isso inclui origens conhecidas e wildcards
    CSRF_TRUSTED_ORIGINS = [
        # Origens do domínio principal
        "https://ut-be.app.webmaxdigital.com",
        "http://ut-be.app.webmaxdigital.com",
        "https://app.webmaxdigital.com",
        "http://app.webmaxdigital.com",
        "https://webmaxdigital.com",
        "http://webmaxdigital.com",
        # Wildcards para subdomínios (Django 4.0+ suporta wildcards)
        "https://*.webmaxdigital.com",
        "http://*.webmaxdigital.com",
        # Localhost para desenvolvimento
        "http://localhost:8000",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://localhost:8000",
        "https://localhost:3000",
        "https://localhost:5173",
    ]

    # Adicionar origens de ALLOWED_HOSTS (se não for wildcard)
    for host in ALLOWED_HOSTS:
        if host not in ("*", "localhost", "127.0.0.1"):
            CSRF_TRUSTED_ORIGINS.append(f"https://{host}")
            CSRF_TRUSTED_ORIGINS.append(f"http://{host}")

    # Remover duplicatas mantendo ordem
    CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(CSRF_TRUSTED_ORIGINS))

    logger.warning(f"[CSRF] ⚠️ Modo permissivo: {len(CSRF_TRUSTED_ORIGINS)} origens configuradas")
    logger.warning(f"[CSRF] ⚠️ Origens: {CSRF_TRUSTED_ORIGINS[:5]}... (e mais)")

# Log final
logger.info(f"[CSRF] CSRF_TRUSTED_ORIGINS final: {len(CSRF_TRUSTED_ORIGINS)} origens")
for origin in CSRF_TRUSTED_ORIGINS[:10]:
    logger.info(f"[CSRF]   - {origin}")
