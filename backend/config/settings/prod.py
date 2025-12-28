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
# CSRF cookie settings - importante para funcionar corretamente
CSRF_COOKIE_SAMESITE = "Lax"  # Permite envio em requisições cross-site GET
CSRF_USE_SESSIONS = False  # Usar cookie CSRF (padrão)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# CSRF Trusted Origins - obrigatório em produção
# Pode ser configurado via variável de ambiente CSRF_TRUSTED_ORIGINS (lista separada por vírgula)
# Se não configurado, deriva de ALLOWED_HOSTS adicionando https://
CSRF_TRUSTED_ORIGINS_ENV_RAW = os.environ.get("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS_ENV = CSRF_TRUSTED_ORIGINS_ENV_RAW.strip()

# #region agent log (apenas se arquivo existir)
import json
import time
import os
log_data = {
    "env_raw": CSRF_TRUSTED_ORIGINS_ENV_RAW,
    "env_raw_repr": repr(CSRF_TRUSTED_ORIGINS_ENV_RAW),
    "env_raw_len": len(CSRF_TRUSTED_ORIGINS_ENV_RAW),
    "env_stripped": CSRF_TRUSTED_ORIGINS_ENV,
    "env_stripped_repr": repr(CSRF_TRUSTED_ORIGINS_ENV),
    "env_stripped_len": len(CSRF_TRUSTED_ORIGINS_ENV),
    "env_is_empty": not CSRF_TRUSTED_ORIGINS_ENV,
}
debug_log_path = "/home/uaimax/projects/uaitools/.cursor/debug.log"
if os.path.exists(os.path.dirname(debug_log_path)):
    try:
        with open(debug_log_path, "a") as f:
            f.write(json.dumps({
                "location": "prod.py:CSRF_TRUSTED_ORIGINS_ENV",
                "message": "Variável CSRF_TRUSTED_ORIGINS do ambiente (raw e stripped)",
                "data": log_data,
                "timestamp": time.time() * 1000,
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "A"
            }) + "\n")
    except (OSError, IOError):
        pass  # Ignorar erros de escrita em produção
# #endregion

# Log da variável bruta (para debug)
import logging
logger = logging.getLogger("django")
logger.info(f"[CSRF] CSRF_TRUSTED_ORIGINS_ENV (raw): '{CSRF_TRUSTED_ORIGINS_ENV_RAW}' (repr: {repr(CSRF_TRUSTED_ORIGINS_ENV_RAW)})")
logger.info(f"[CSRF] CSRF_TRUSTED_ORIGINS_ENV (stripped): '{CSRF_TRUSTED_ORIGINS_ENV}' (repr: {repr(CSRF_TRUSTED_ORIGINS_ENV)})")

if CSRF_TRUSTED_ORIGINS_ENV:
    # Usar lista da variável de ambiente
    # Normalizar origens: remover espaços, trailing slashes, e garantir lowercase
    CSRF_TRUSTED_ORIGINS = []
    for origin in CSRF_TRUSTED_ORIGINS_ENV.split(","):
        origin = origin.strip()
        if origin:
            # Remover trailing slash se existir (Django é sensível a isso)
            origin = origin.rstrip("/")
            CSRF_TRUSTED_ORIGINS.append(origin)
    # #region agent log (apenas se arquivo existir)
    log_data = {
        "origins_list": CSRF_TRUSTED_ORIGINS,
        "origins_count": len(CSRF_TRUSTED_ORIGINS),
        "expected_origin": "https://ut-be.app.webmaxdigital.com",
        "expected_in_list": "https://ut-be.app.webmaxdigital.com" in CSRF_TRUSTED_ORIGINS,
    }
    if os.path.exists(os.path.dirname(debug_log_path)):
        try:
            with open(debug_log_path, "a") as f:
                f.write(json.dumps({
                    "location": "prod.py:CSRF_TRUSTED_ORIGINS_parsed",
                    "message": "CSRF_TRUSTED_ORIGINS após parsing",
                    "data": log_data,
                    "timestamp": time.time() * 1000,
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "B"
                }) + "\n")
        except (OSError, IOError):
            pass  # Ignorar erros de escrita em produção
    # #endregion
    logger.info(f"[CSRF] CSRF_TRUSTED_ORIGINS configurado da variável: {CSRF_TRUSTED_ORIGINS}")
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

    logger.info(f"[CSRF] CSRF_TRUSTED_ORIGINS derivado de ALLOWED_HOSTS: {CSRF_TRUSTED_ORIGINS}")

# Garantir que CSRF_TRUSTED_ORIGINS é uma lista (não pode ser None)
if not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = []
    logger.warning("[CSRF] ⚠️ CSRF_TRUSTED_ORIGINS está vazio! Isso pode causar erros de CSRF.")

# #region agent log (apenas se arquivo existir)
log_data = {
    "final_origins": CSRF_TRUSTED_ORIGINS,
    "final_count": len(CSRF_TRUSTED_ORIGINS),
    "final_type": type(CSRF_TRUSTED_ORIGINS).__name__,
    "expected_origin": "https://ut-be.app.webmaxdigital.com",
    "expected_in_final": "https://ut-be.app.webmaxdigital.com" in CSRF_TRUSTED_ORIGINS,
}
if os.path.exists(os.path.dirname(debug_log_path)):
    try:
        with open(debug_log_path, "a") as f:
            f.write(json.dumps({
                "location": "prod.py:CSRF_TRUSTED_ORIGINS_final",
                "message": "CSRF_TRUSTED_ORIGINS final configurado",
                "data": log_data,
                "timestamp": time.time() * 1000,
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "C"
            }) + "\n")
    except (OSError, IOError):
        pass  # Ignorar erros de escrita em produção
# #endregion

# Log final (sempre, para debug)
logger.info(f"[CSRF] ✅ CSRF_TRUSTED_ORIGINS final: {CSRF_TRUSTED_ORIGINS}")
logger.info(f"[CSRF] 📊 Total de origens confiáveis: {len(CSRF_TRUSTED_ORIGINS)}")
for i, origin in enumerate(CSRF_TRUSTED_ORIGINS, 1):
    logger.info(f"[CSRF]   {i}. {origin} (len={len(origin)})")

