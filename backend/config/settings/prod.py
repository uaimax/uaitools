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
    parsed = urlparse(DATABASE_URL)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path[1:],  # Remove leading /
            "USER": parsed.username,
            "PASSWORD": parsed.password,
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

