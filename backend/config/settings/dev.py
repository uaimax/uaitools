"""Development settings.

SQLite database (fallback) ou PostgreSQL via DATABASE_URL, DEBUG=True, CORS permissivo.

⚠️ REGRA CRÍTICA: NUNCA sobrescrever listas definidas em base.py!
- CSRF_TRUSTED_ORIGINS: apenas adicionar (usar .append())
- CORS_ALLOWED_ORIGINS: apenas adicionar (usar .append())
- MIDDLEWARE: apenas adicionar/modificar ordem (não redefinir)
- INSTALLED_APPS: apenas adicionar (usar .append())

Sobrescrever listas remove configurações importantes de base.py e quebra produção!
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
# =============================================================================
# CSRF_TRUSTED_ORIGINS - APENAS ADICIONAR (NUNCA SOBRESCREVER!)
# =============================================================================
# ⚠️ CRÍTICO: base.py já define origens de produção e outras necessárias.
# NUNCA fazer: CSRF_TRUSTED_ORIGINS = [...] (isso remove todas as origens!)
# SEMPRE usar: CSRF_TRUSTED_ORIGINS.append(...) ou verificar antes de adicionar
# =============================================================================
if "http://localhost:5173" not in CSRF_TRUSTED_ORIGINS:  # noqa: F405
    CSRF_TRUSTED_ORIGINS.append("http://localhost:5173")  # noqa: F405
if "http://127.0.0.1:5173" not in CSRF_TRUSTED_ORIGINS:  # noqa: F405
    CSRF_TRUSTED_ORIGINS.append("http://127.0.0.1:5173")  # noqa: F405
# Expo adiciona automaticamente origens do tunnel
# Para desenvolvimento mobile, CORS_ALLOW_ALL_ORIGINS pode ser True temporariamente
# Expo adiciona automaticamente origens do tunnel
# Para desenvolvimento mobile, CORS_ALLOW_ALL_ORIGINS pode ser True temporariamente

# Rate limiting DESABILITADO em desenvolvimento para facilitar testes
# O app mobile pode fazer múltiplas tentativas durante desenvolvimento
if "SUPBRAINNOTE_UPLOAD_RATE" not in os.environ:
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["supbrainnote_upload"] = "10000/hour"  # noqa: F405
if "SUPBRAINNOTE_QUERY_RATE" not in os.environ:
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["supbrainnote_query"] = "10000/hour"  # noqa: F405
# Também aumentar rate limits gerais em dev
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["anon"] = "10000/hour"  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["user"] = "10000/hour"  # noqa: F405

# =============================================================================
# VALIDAÇÃO: Garantir que listas importantes não foram sobrescritas
# =============================================================================
# Verificar se CSRF_TRUSTED_ORIGINS contém a origem de produção
# Se não contém, significa que foi sobrescrito incorretamente
_CSRF_HAS_PRODUCTION_ORIGIN = "https://ut-be.app.webmaxdigital.com" in CSRF_TRUSTED_ORIGINS  # noqa: F405
if not _CSRF_HAS_PRODUCTION_ORIGIN:
    import logging
    logger = logging.getLogger("django")
    logger.error("[DEV] ⚠️ ERRO CRÍTICO: CSRF_TRUSTED_ORIGINS não contém origem de produção!")
    logger.error("[DEV] ⚠️ Isso indica que a lista foi sobrescrita incorretamente")
    logger.error("[DEV] ⚠️ Verifique se está usando .append() ao invés de = [...]")

# =============================================================================
# CORS para desenvolvimento mobile (Expo)
# =============================================================================
# ⚠️ ATENÇÃO: Apenas para desenvolvimento! NUNCA em produção!
# Expo tunnel adiciona origens dinamicamente, então permitir todas facilita testes
# Para produção, use CORS_ALLOWED_ORIGINS com lista específica
CORS_ALLOW_ALL_ORIGINS = os.environ.get("CORS_ALLOW_ALL_ORIGINS", "False").lower() in ("true", "1", "yes")

