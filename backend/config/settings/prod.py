"""Production settings.

PostgreSQL via DATABASE_URL, DEBUG=False, security headers.

IMPORTANTE: Este arquivo é carregado apenas quando ENVIRONMENT=production.
As variáveis de ambiente são lidas em RUNTIME (quando o container inicia),
não durante o build do Docker.

SIMPLIFICADO: Apenas adiciona configurações específicas de produção.
O base.py já tem CSRF_TRUSTED_ORIGINS e MIDDLEWARE configurados corretamente.
"""

import logging
import os
from urllib.parse import unquote, urlparse

from .base import *  # noqa: F403, F401

logger = logging.getLogger("django")

# =============================================================================
# DEBUG
# =============================================================================
DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1", "yes")

# =============================================================================
# ALLOWED_HOSTS
# =============================================================================
# Em produção, ALLOWED_HOSTS deve ser configurado via variável de ambiente
# Fallback para "*" permite deploy sem configuração (não recomendado para produção real)
ALLOWED_HOSTS_ENV = os.environ.get("ALLOWED_HOSTS", "*")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_ENV.split(",") if host.strip()]
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["*"]  # Fallback seguro para evitar erros

# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

if DATABASE_URL:
    # Parse DATABASE_URL (formato: postgresql://user:pass@host:port/dbname)
    parsed = urlparse(DATABASE_URL)
    password = unquote(parsed.password) if parsed.password else ""

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path[1:],  # Remove leading /
            "USER": parsed.username,
            "PASSWORD": password,
            "HOST": parsed.hostname,
            "PORT": parsed.port or 5432,
            "CONN_MAX_AGE": 60,  # Connection pooling
        }
    }
    logger.info(f"[PROD] ✅ PostgreSQL configurado: {parsed.hostname}")
else:
    # Fallback para SQLite (apenas para testes locais - NÃO usar em produção)
    logger.warning("[PROD] ⚠️ DATABASE_URL não configurado - usando SQLite")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

# =============================================================================
# SECURITY SETTINGS
# =============================================================================
# Simplificado: sempre desabilitar verificações SSL em modo permissivo
# (quando ALLOWED_HOSTS=*)
_PERMISSIVE_MODE = "*" in ALLOWED_HOSTS

SECURE_SSL_REDIRECT = False  # Desabilitado para funcionar com proxy reverso
SESSION_COOKIE_SECURE = False  # Desabilitado para funcionar com HTTP
CSRF_COOKIE_SECURE = False  # Desabilitado para funcionar com HTTP
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"  # Permite cookies em requisições cross-origin

# Configurações de segurança que sempre devem estar ativas
CSRF_USE_SESSIONS = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "SAMEORIGIN"  # Permite iframe (necessário para alguns casos)

# =============================================================================
# LOGGING
# =============================================================================
# Log de inicialização
logger.info(f"[PROD] Django iniciado em modo {'DEBUG' if DEBUG else 'PRODUCTION'}")
logger.info(f"[PROD] ALLOWED_HOSTS: {ALLOWED_HOSTS}")
logger.warning(f"[PROD] CSRF_TRUSTED_ORIGINS: {len(CSRF_TRUSTED_ORIGINS)} origens")  # noqa: F405
# Log detalhado das origens para debug
for origin in CSRF_TRUSTED_ORIGINS[:10]:  # noqa: F405
    logger.warning(f"[PROD]   ✅ {origin}")
if len(CSRF_TRUSTED_ORIGINS) > 10:  # noqa: F405
    logger.warning(f"[PROD]   ... e mais {len(CSRF_TRUSTED_ORIGINS) - 10} origens")  # noqa: F405
