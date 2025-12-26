"""Base settings for Django project.

Configuracoes compartilhadas entre dev e prod.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Carrega variaveis de ambiente do arquivo .env
load_dotenv()

# Build paths inside the project
# Usa resolve() para garantir caminho absoluto e normalizado
# parent.parent.parent = config/settings/ -> config/ -> backend/ -> raiz
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-change-me-in-production")

# Application definition
INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",  # Necessário para django-allauth
    # Third party
    "rest_framework",
    "drf_spectacular",
    "corsheaders",  # CORS para desenvolvimento
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.github",
    "allauth.socialaccount.providers.microsoft",
    "allauth.socialaccount.providers.instagram",
    "allauth.socialaccount.providers.linkedin_oauth2",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "rest_framework_simplejwt",
    # Local apps
    "apps.core",
    "apps.accounts",
    "apps.leads",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # CORS deve vir antes de CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",  # i18n - deve vir após SessionMiddleware
    "apps.core.middleware.UUIDSessionMiddleware",  # Limpa sessões com IDs antigos (antes do auth)
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",  # django-allauth
    "apps.core.middleware.WorkspaceMiddleware",  # Multi-tenancy
    "apps.core.middleware.ErrorLoggingMiddleware",  # Captura exceções não tratadas
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

# API Configuration
API_PREFIX = "/api"  # Prefixo padrão para todas as APIs
API_VERSION = os.environ.get("API_VERSION", "v1").strip()  # Versão atual da API

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # Para servir SPA quando implementado
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

# Idiomas suportados
LANGUAGES = [
    ("pt-br", "Português (Brasil)"),
    ("en", "English"),
]

# Caminho para arquivos de tradução (nível projeto)
LOCALE_PATHS = [BASE_DIR / "locale"]

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom User Model
AUTH_USER_MODEL = "accounts.User"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    # Paginação padrão (similar ao Django Admin)
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": int(os.environ.get("API_PAGE_SIZE", "25")),
    # Rate Limiting - Configuração base (pode ser sobrescrita por view)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.environ.get("API_THROTTLE_ANON", "100/hour"),
        "user": os.environ.get("API_THROTTLE_USER", "1000/hour"),
        "logging": "100/hour",  # Limite para endpoint de logs
    },
}

# URLs Configuration - Preparado para separação futura
# FRONTEND_URL: URL do frontend (vazio = mesmo domínio, usado para CORS quando separar)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").strip()
# API_URL: Prefixo da API (relativo quando junto, absoluto quando separado)
API_URL = os.environ.get("API_URL", "/api").strip()
# ADMIN_URL_PREFIX: Prefixo do Django Admin (padrão: "manage" - mais seguro que "admin")
ADMIN_URL_PREFIX = os.environ.get("ADMIN_URL_PREFIX", "manage").strip().strip("/")

# Project Branding - Configurável via variáveis de ambiente
# IMPORTANTE: Definir ANTES de usar em SPECTACULAR_SETTINGS e JAZZMIN_SETTINGS
PROJECT_NAME = os.environ.get("PROJECT_NAME", "SaaS Bootstrap").strip()
SITE_TITLE = os.environ.get("SITE_TITLE", f"{PROJECT_NAME} Admin").strip()
SITE_HEADER = os.environ.get("SITE_HEADER", PROJECT_NAME).strip()
SITE_BRAND = os.environ.get("SITE_BRAND", PROJECT_NAME).strip()
API_TITLE = os.environ.get("API_TITLE", f"{PROJECT_NAME} API").strip()
COPYRIGHT = os.environ.get("COPYRIGHT", PROJECT_NAME).strip()

# SaaS Workspace Information - Para documentos legais globais
# Essas informações são usadas para substituir placeholders em documentos legais
SAAS_WORKSPACE_NAME = os.environ.get("SAAS_WORKSPACE_NAME", PROJECT_NAME).strip()
SAAS_WORKSPACE_LEGAL_NAME = os.environ.get("SAAS_WORKSPACE_LEGAL_NAME", SAAS_WORKSPACE_NAME).strip()
SAAS_WORKSPACE_CNPJ = os.environ.get("SAAS_WORKSPACE_CNPJ", "").strip()
SAAS_WORKSPACE_ADDRESS = os.environ.get("SAAS_WORKSPACE_ADDRESS", "").strip()
SAAS_WORKSPACE_CITY = os.environ.get("SAAS_WORKSPACE_CITY", "").strip()
SAAS_WORKSPACE_STATE = os.environ.get("SAAS_WORKSPACE_STATE", "").strip()
SAAS_WORKSPACE_PHONE = os.environ.get("SAAS_WORKSPACE_PHONE", "").strip()
SAAS_WORKSPACE_EMAIL = os.environ.get("SAAS_WORKSPACE_EMAIL", "contato@saasbootstrap.com").strip()
SAAS_WORKSPACE_WEBSITE = os.environ.get("SAAS_WORKSPACE_WEBSITE", "").strip()
SAAS_SUPPORT_HOURS = os.environ.get("SAAS_SUPPORT_HOURS", "Segunda a Sexta, 9h às 18h").strip()
SAAS_DPO_NAME = os.environ.get("SAAS_DPO_NAME", "").strip()
SAAS_DPO_EMAIL = os.environ.get("SAAS_DPO_EMAIL", "").strip()
SAAS_DPO_PHONE = os.environ.get("SAAS_DPO_PHONE", "").strip()
SAAS_DPO_ADDRESS = os.environ.get("SAAS_DPO_ADDRESS", "").strip()

# ===========================================
# Email/SMTP Configuration
# ===========================================
# Funciona com qualquer provedor SMTP (Mailgun, SendGrid, SES, etc)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "False").lower() in ("true", "1", "yes")
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", f"noreply@{PROJECT_NAME.lower().replace(' ', '')}.com")
DEFAULT_FROM_NAME = os.environ.get("DEFAULT_FROM_NAME", PROJECT_NAME)

# Timeout para conexões SMTP (em segundos)
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "30"))

# Password Reset Configuration
PASSWORD_RESET_TOKEN_EXPIRATION_HOURS = int(os.environ.get("PASSWORD_RESET_TOKEN_EXPIRATION_HOURS", "24"))
PASSWORD_RESET_URL_PATH = os.environ.get("PASSWORD_RESET_URL_PATH", "/reset-password").strip()

# drf-spectacular (OpenAPI) - Definido DEPOIS das variáveis de branding
SPECTACULAR_SETTINGS = {
    "TITLE": API_TITLE,
    "DESCRIPTION": f"API REST para {PROJECT_NAME}",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": f"/api/{API_VERSION}",
}

# CORS Configuration
CORS_ENABLED = os.environ.get("CORS_ENABLED", "True") == "True"  # True por padrão em dev
if CORS_ENABLED:
    # Permitir credenciais (cookies/sessão) do frontend
    CORS_ALLOW_CREDENTIALS = True
    # Em desenvolvimento, permitir localhost
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ]
    # Headers permitidos
    CORS_ALLOW_HEADERS = [
        "accept",
        "accept-encoding",
        "authorization",
        "content-type",
        "dnt",
        "origin",
        "user-agent",
        "x-csrftoken",
        "x-requested-with",
        "x-workspace-id",  # Header customizado para multi-tenancy
    ]
else:
    CORS_ALLOW_ALL_ORIGINS = False

# LGPD - Política de Retenção de Dados (OBRIGATÓRIO)
# Define quantos dias manter logs de auditoria
# Mínimo legal LGPD: 365 dias (1 ano)
# Recomendado: 1095 dias (3 anos)
AUDIT_LOG_RETENTION_DAYS = int(os.environ.get("AUDIT_LOG_RETENTION_DAYS", "1095"))

# Validação: garantir mínimo legal de 1 ano
if AUDIT_LOG_RETENTION_DAYS < 365:
    import warnings

    warnings.warn(
        f"AUDIT_LOG_RETENTION_DAYS ({AUDIT_LOG_RETENTION_DAYS}) é menor que o mínimo legal LGPD (365 dias). "
        "Configure pelo menos 365 dias para compliance.",
        UserWarning,
    )

# Django Jazzmin (Admin Theme)
JAZZMIN_SETTINGS = {
    "site_title": SITE_TITLE,
    "site_header": SITE_HEADER,
    "site_brand": SITE_BRAND,
    "site_logo": None,
    "login_logo": None,
    "login_logo_dark": None,
    "site_logo_classes": "img-circle",
    "site_icon": None,
    "welcome_sign": f"Bem-vindo ao {SITE_TITLE}",
    "copyright": COPYRIGHT,
    "search_model": ["accounts.User", "accounts.Workspace"],
    "user_avatar": None,
    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {
            "name": "Support",
            "url": "https://github.com/farridav/django-jazzmin/issues",
            "new_window": True,
        },
    ],
    "usermenu_links": [
        {
            "name": "Support",
            "url": "https://github.com/farridav/django-jazzmin/issues",
            "new_window": True,
        },
        {"model": "auth.user"},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "order_with_respect_to": ["accounts", "accounts.Workspace", "accounts.User"],
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "accounts.Tenant": "fas fa-building",
        "accounts.User": "fas fa-user-tie",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active": False,
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": False,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": False,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}

# Celery Configuration
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutos
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutos

# Cache Configuration - Redis
# Usa Redis DB 1 (DB 0 é para Celery)
REDIS_CACHE_URL = os.environ.get("REDIS_CACHE_URL", "redis://localhost:6379/1")
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_CACHE_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SOCKET_CONNECT_TIMEOUT": 5,
            "SOCKET_TIMEOUT": 5,
            "COMPRESSOR": "django_redis.compressors.zlib.ZlibCompressor",
            "IGNORE_EXCEPTIONS": True,  # Não quebrar app se Redis cair
        },
        "KEY_PREFIX": f"{PROJECT_NAME.lower().replace(' ', '_')}:cache",
        "TIMEOUT": int(os.environ.get("CACHE_DEFAULT_TIMEOUT", "300")),  # 5 minutos padrão
    }
}

# Site ID (necessário para django-allauth)
SITE_ID = 1

# django-allauth Configuration
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = "optional"  # Para SPAs

# dj-rest-auth Configuration
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_COOKIE": "access-token",
    "JWT_AUTH_REFRESH_COOKIE": "refresh-token",
    "JWT_AUTH_HTTPONLY": False,  # Para SPAs
    "TOKEN_MODEL": None,  # Não usar Token model padrão, apenas JWT
}

# Social Account Adapter customizado
SOCIALACCOUNT_ADAPTER = "apps.accounts.adapters.WorkspaceSocialAccountAdapter"

# Social Auth Providers (opcionais - apenas se configurados)
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
MICROSOFT_CLIENT_ID = os.environ.get("MICROSOFT_CLIENT_ID", "")
MICROSOFT_CLIENT_SECRET = os.environ.get("MICROSOFT_CLIENT_SECRET", "")
MICROSOFT_TENANT_ID = os.environ.get("MICROSOFT_TENANT_ID", "common")  # common, organizations, consumers
INSTAGRAM_CLIENT_ID = os.environ.get("INSTAGRAM_CLIENT_ID", "")
INSTAGRAM_CLIENT_SECRET = os.environ.get("INSTAGRAM_CLIENT_SECRET", "")
LINKEDIN_CLIENT_ID = os.environ.get("LINKEDIN_CLIENT_ID", "")
LINKEDIN_CLIENT_SECRET = os.environ.get("LINKEDIN_CLIENT_SECRET", "")

# Configuração específica de providers (opcional - pode ser feito via Admin também)
SOCIALACCOUNT_PROVIDERS = {
    "microsoft": {
        "APPS": [
            {
                "client_id": MICROSOFT_CLIENT_ID,
                "secret": MICROSOFT_CLIENT_SECRET,
                "settings": {
                    "tenant": MICROSOFT_TENANT_ID,  # common, organizations, consumers
                }
            }
        ]
        if MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET
        else []
    },
    "instagram": {
        "SCOPE": ["user_profile", "user_media"],
        "AUTH_PARAMS": {"access_type": "online"},
    },
    "linkedin_oauth2": {
        "SCOPE": ["r_liteprofile", "r_emailaddress"],
        "PROFILE_FIELDS": [
            "id",
            "first-name",
            "last-name",
            "email-address",
            "picture-url",
            "public-profile-url",
        ],
    },
}

# Social Auth Providers (opcionais - apenas se configurados)
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
MICROSOFT_CLIENT_ID = os.environ.get("MICROSOFT_CLIENT_ID", "")
MICROSOFT_CLIENT_SECRET = os.environ.get("MICROSOFT_CLIENT_SECRET", "")

# Logging Configuration - Estruturado para produção
# Formato: JSON em produção, texto em desenvolvimento
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.environ.get("LOG_FORMAT", "text")  # 'text' ou 'json'
USE_JSON_LOGGING = LOG_FORMAT == "json" and not DEBUG

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d",
        },
    },
    "filters": {
        "require_debug_true": {
            "()": "django.utils.log.RequireDebugTrue",
        },
        "sensitive_data": {
            "()": "apps.core.logging.SensitiveDataFilter",
        },
    },
    "handlers": {
        "console": {
            "level": LOG_LEVEL,
            "class": "logging.StreamHandler",
            "formatter": "json" if USE_JSON_LOGGING else "verbose",
            "filters": ["sensitive_data"],  # Redige dados sensíveis
        },
        "file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "django.log",
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 5,
            "formatter": "json" if USE_JSON_LOGGING else "verbose",
            "filters": ["sensitive_data"],  # Redige dados sensíveis
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console", "file"],
            "level": "ERROR",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}

# Criar diretório de logs se não existir
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Sentry/GlitchTip (opcional) - Sistema de logging híbrido
# Suporta Sentry SaaS ou GlitchTip (self-hosted, compatível com API do Sentry)
USE_SENTRY = os.environ.get("USE_SENTRY", "false").lower() == "true"
SENTRY_DSN = os.environ.get("SENTRY_DSN", "")  # Funciona com Sentry ou GlitchTip
SENTRY_API_TOKEN = os.environ.get("SENTRY_API_TOKEN", "")  # Token para buscar erros via API (opcional)
LOG_RETENTION_DAYS = int(os.environ.get("LOG_RETENTION_DAYS", "7"))

if USE_SENTRY and SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration

        # Configuração funciona tanto com Sentry quanto com GlitchTip
        # GlitchTip é compatível com a API do Sentry, então usa os mesmos SDKs
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                DjangoIntegration(),
                CeleryIntegration(),
            ],
            traces_sample_rate=0.1,  # 10% das transações
            environment=os.environ.get("ENVIRONMENT", "production"),
            # Filtro de dados sensíveis já é feito pelo SensitiveDataFilter
        )
    except ImportError:
        # Sentry SDK não instalado - usar fallback para banco
        USE_SENTRY = False

