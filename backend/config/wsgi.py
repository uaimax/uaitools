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

        # Função para filtrar e adicionar tags customizadas
        def filter_and_tag_sentry_events(event, hint):
            """
            Filtra eventos que não devem ser enviados para Sentry/GlitchTip
            e adiciona tags customizadas.
            """
            # Filtrar erros de migração relacionados a índices já existentes
            if "exception" in event:
                exceptions = event["exception"].get("values", [])
                for exc in exceptions:
                    exc_type = exc.get("type", "")
                    exc_value = exc.get("value", "")
                    # Ignorar erro de índice já existente (já foi resolvido)
                    if "ProgrammingError" in exc_type and "already exists" in exc_value:
                        if "note_transcript_gin_idx" in exc_value:
                            return None  # Não enviar para Sentry

            # Filtrar erros HTTP esperados
            if "message" in event:
                message = event["message"]
                # Ignorar 401 de login (credenciais inválidas são esperadas)
                if "HTTP Error 401" in message and "/api/v1/auth/login/" in message:
                    return None  # Não enviar para Sentry

                # Ignorar 404 de varredura/bots
                path = event.get("request", {}).get("url", "")
                if "HTTP Error 404" in message:
                    # Padrões de varredura conhecidos
                    bot_patterns = [
                        "/wp-", "/wp/", "/wordpress/", "/blog/", "/wp-includes/",
                        "/_next/", "/api/actions", "/api/action", "/apps",
                        "/.git/", "/xmlrpc.php", "/wlwmanifest.xml",
                        "/sito/", "/cms/", "/media/", "/web/", "/site/",
                        "/shop/", "/2019/", "/2018/", "/test/", "/news/",
                        "/website/", "/wp1/", "/wp2/"
                    ]
                    if any(pattern in path for pattern in bot_patterns):
                        return None  # Não enviar para Sentry

            # Filtrar por contexto HTTP
            if "contexts" in event:
                http_error = event["contexts"].get("http_error", {})
                if http_error:
                    status_code = http_error.get("status_code")
                    path = http_error.get("path", "")

                    # Ignorar 401 de login
                    if status_code == 401 and "/api/v1/auth/login/" in path:
                        return None

                    # Ignorar 404 de varredura
                    if status_code == 404:
                        bot_patterns = [
                            "/wp-", "/wp/", "/wordpress/", "/blog/", "/wp-includes/",
                            "/_next/", "/api/actions", "/api/action", "/apps",
                            "/.git/", "/xmlrpc.php", "/wlwmanifest.xml",
                            "/sito/", "/cms/", "/media/", "/web/", "/site/",
                            "/shop/", "/2019/", "/2018/", "/test/", "/news/",
                            "/website/", "/wp1/", "/wp2/"
                        ]
                        if any(pattern in path for pattern in bot_patterns):
                            return None

            # Adicionar tags customizadas
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
            before_send=filter_and_tag_sentry_events,
        )
        # Log para confirmar inicialização (apenas em produção, não aparece em dev)
        print(f"[Sentry] ✅ Sentry/GlitchTip inicializado - Environment: {environment}")
    except ImportError:
        # Sentry SDK não instalado - continuar sem Sentry
        print("[Sentry] ⚠️  sentry-sdk não está instalado")
    except Exception as e:
        # Erro ao inicializar Sentry - logar mas continuar
        print(f"[Sentry] ❌ Erro ao inicializar Sentry: {e}")
else:
    # Log quando Sentry não está configurado (apenas em produção)
    if not USE_SENTRY:
        print("[Sentry] ⚠️  USE_SENTRY não está configurado como 'true'")
    if not SENTRY_DSN:
        print("[Sentry] ⚠️  SENTRY_DSN não está configurado")

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Tentar inicializar Django e capturar erros de boot
try:
    application = get_wsgi_application()
except Exception as e:
    # Se houver erro durante o boot, tentar enviar para Sentry se estiver configurado
    if USE_SENTRY and SENTRY_DSN:
        try:
            import sentry_sdk
            # Capturar o erro manualmente
            sentry_sdk.capture_exception(e)
            # Tentar enviar (flush) antes de re-raise
            sentry_sdk.flush(timeout=2)
        except Exception:
            # Se não conseguir enviar para Sentry, apenas logar
            pass

    # Re-raise o erro para que o Gunicorn veja e reporte nos logs
    raise

