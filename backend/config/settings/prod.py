"""Production settings.

PostgreSQL via DATABASE_URL, DEBUG=False, security headers.
"""

import os
from urllib.parse import urlparse

from .base import *  # noqa: F403, F401

DEBUG = os.environ.get("DEBUG", "False") == "True"  # noqa: F405

# ALLOWED_HOSTS obrigatório em produção
ALLOWED_HOSTS_ENV = os.environ.get("ALLOWED_HOSTS", "")  # noqa: F405
if not ALLOWED_HOSTS_ENV:
    raise ValueError("ALLOWED_HOSTS environment variable is required in production")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_ENV.split(",") if host.strip()]  # noqa: F405

# Database - PostgreSQL via DATABASE_URL
DATABASE_URL = os.environ.get("DATABASE_URL")  # noqa: F405
if DATABASE_URL:
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
    raise ValueError("DATABASE_URL environment variable is required in production")

# Security settings para prod
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# CSRF Trusted Origins - obrigatório em produção
# Pode ser configurado via variável de ambiente CSRF_TRUSTED_ORIGINS (lista separada por vírgula)
# Se não configurado, deriva de ALLOWED_HOSTS adicionando https://
CSRF_TRUSTED_ORIGINS_ENV = os.environ.get("CSRF_TRUSTED_ORIGINS", "")
if CSRF_TRUSTED_ORIGINS_ENV:
    # Usar lista da variável de ambiente
    CSRF_TRUSTED_ORIGINS = [
        origin.strip() for origin in CSRF_TRUSTED_ORIGINS_ENV.split(",") if origin.strip()
    ]
else:
    # Derivar de ALLOWED_HOSTS (adicionar https:// para cada host)
    # Ignorar wildcards (*) e localhost
    CSRF_TRUSTED_ORIGINS = []
    for host in ALLOWED_HOSTS:  # noqa: F405
        if host not in ("*", "localhost", "127.0.0.1"):
            # Adicionar https:// para cada host válido
            CSRF_TRUSTED_ORIGINS.append(f"https://{host}")
    
    # Se não houver hosts válidos, usar lista vazia (não recomendado)
    if not CSRF_TRUSTED_ORIGINS:
        # Fallback: tentar usar ALLOWED_HOSTS mesmo com wildcard
        # Isso é menos seguro, mas pode ser necessário em alguns casos
        CSRF_TRUSTED_ORIGINS = [f"https://{host}" for host in ALLOWED_HOSTS if host != "*"]  # noqa: F405

