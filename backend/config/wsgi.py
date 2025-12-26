"""WSGI config for config project."""

import os

# Inicializar Sentry/GlitchTip ANTES do Django setup para capturar erros de boot
# Isso garante que erros durante django.setup() sejam capturados
USE_SENTRY = os.environ.get("USE_SENTRY", "false").lower() == "true"
SENTRY_DSN = os.environ.get("SENTRY_DSN", "")

if USE_SENTRY and SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration

        # Obter configurações de ambiente
        env_raw = os.environ.get("ENVIRONMENT", "production")
        env_map = {"dev": "development", "prod": "production"}
        environment = env_map.get(env_raw.lower(), env_raw.lower())
        release = os.environ.get("RELEASE", None)
        server_name = os.environ.get("SERVER_NAME", None)

        # Função para adicionar tags customizadas
        def add_sentry_tags(event, hint):
            if "tags" not in event:
                event["tags"] = {}
            event["tags"]["environment"] = environment
            event["tags"]["is_production"] = environment == "production"
            deployment_type = os.environ.get("DEPLOYMENT_TYPE", "unknown")
            event["tags"]["deployment_type"] = deployment_type
            if "extra" not in event:
                event["extra"] = {}
            event["extra"]["django_env"] = os.environ.get("ENVIRONMENT", "unknown")
            return event

        # Inicializar Sentry antes do Django setup para capturar erros de boot
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                DjangoIntegration(),
                CeleryIntegration(),
            ],
            traces_sample_rate=0.1,
            environment=environment,
            release=release,
            server_name=server_name,
            before_send=add_sentry_tags,
        )
    except ImportError:
        # Sentry SDK não instalado - continuar sem Sentry
        pass

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()

