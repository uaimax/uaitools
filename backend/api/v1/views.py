"""Views da API v1."""

from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


@extend_schema(
    summary="Health Check",
    description="Endpoint de health check da API. Retorna status da API e informações básicas.",
    tags=["Health"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request: Request) -> Response:
    """Endpoint de health check da API.

    Retorna status da API e informações básicas.
    Útil para monitoramento e verificação de disponibilidade.
    """
    from django.conf import settings

    return Response(
        {
            "status": "healthy",
            "version": "1.0.0",
            "api_prefix": getattr(settings, "API_PREFIX", "/api"),
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Dashboard Stats",
    description="Estatísticas do dashboard (leads, conversões, etc.) filtradas por workspace.",
    tags=["Dashboard"],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request: Request) -> Response:
    """Endpoint para estatísticas do dashboard.

    Retorna estatísticas de leads filtradas por workspace:
    - total_leads: Total de leads do workspace
    - new_leads: Leads criados nos últimos 30 dias
    - converted_leads: Leads com status 'converted'

    Super admins veem estatísticas de todos os workspaces se não houver workspace no request.
    """
    try:
        from apps.leads.models import Lead
        from apps.accounts.models import Workspace
        from django.utils import timezone

        # Verificar se usuário está autenticado
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return Response(
                {"detail": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Obter workspace do request (definido pelo middleware)
        workspace = getattr(request, "workspace", None)

        # Verificar se é super admin
        is_superuser = getattr(request.user, "is_superuser", False)

        # Base queryset - filtrar por workspace se não for super admin
        if is_superuser and not workspace:
            # Super admin sem workspace selecionado: ver todos os leads
            queryset = Lead.objects.all()
        elif workspace:
            # Filtrar por workspace do request
            queryset = Lead.objects.filter(workspace=workspace)
        else:
            # Sem workspace e não é super admin: retornar zeros
            return Response(
                {
                    "total_leads": 0,
                    "new_leads": 0,
                    "converted_leads": 0,
                },
                status=status.HTTP_200_OK,
            )

        # Calcular estatísticas
        total_leads = queryset.count()

        # Leads dos últimos 30 dias
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_leads = queryset.filter(created_at__gte=thirty_days_ago).count()

        # Leads convertidos
        converted_leads = queryset.filter(status="converted").count()

        return Response(
            {
                "total_leads": total_leads,
                "new_leads": new_leads,
                "converted_leads": converted_leads,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        # Log do erro para debug
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        logger.exception("Erro ao buscar estatísticas do dashboard")

        # Em desenvolvimento, retornar detalhes do erro para facilitar debug
        # Em produção, remover traceback
        error_detail = {
            "detail": "Erro ao buscar estatísticas do dashboard",
            "error": str(e),
            "type": type(e).__name__,
        }

        # Adicionar traceback apenas em DEBUG
        from django.conf import settings
        if getattr(settings, "DEBUG", False):
            error_detail["traceback"] = traceback.format_exc()

        return Response(
            error_detail,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    summary="API Info",
    description="Informações sobre a API, incluindo versão e endpoints disponíveis.",
    tags=["Info"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def api_info(request: Request) -> Response:
    """Informações sobre a API.

    Retorna informações sobre a API, incluindo versão e endpoints disponíveis.
    """
    from django.conf import settings

    api_title = getattr(settings, "API_TITLE", "API")
    project_name = getattr(settings, "PROJECT_NAME", "SaaS Bootstrap")

    return Response(
        {
            "name": api_title,
            "version": "1.0.0",
            "description": f"API REST para {project_name}",
            "api_prefix": getattr(settings, "API_PREFIX", "/api"),
            "openapi_schema": "/api/v1/schema/",
            "swagger_ui": "/api/v1/schema/swagger-ui/",
            "redoc": "/api/v1/schema/redoc/",
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Test Sentry/GlitchTip",
    description="Endpoint de teste para verificar se Sentry/GlitchTip está configurado e funcionando. Envia uma mensagem e uma exceção de teste.",
    tags=["Health"],
)
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def test_sentry(request: Request) -> Response:
    """Endpoint de teste para Sentry/GlitchTip.

    Verifica se Sentry/GlitchTip está configurado e envia mensagens de teste.
    Útil para validar que erros estão sendo enviados corretamente.
    """
    import os
    from django.conf import settings

    # Verificar configuração
    use_sentry = os.environ.get("USE_SENTRY", "false").lower() == "true"
    sentry_dsn = os.environ.get("SENTRY_DSN", "")
    sentry_configured = use_sentry and bool(sentry_dsn)

    result = {
        "sentry_configured": sentry_configured,
        "use_sentry": use_sentry,
        "sentry_dsn_configured": bool(sentry_dsn),
        "sentry_initialized": False,
        "test_message_sent": False,
        "test_exception_sent": False,
    }

    if not sentry_configured:
        return Response(
            {
                **result,
                "message": "Sentry/GlitchTip não está configurado. Configure USE_SENTRY=true e SENTRY_DSN no ambiente.",
            },
            status=status.HTTP_200_OK,
        )

    # Verificar se Sentry SDK está instalado e inicializado
    try:
        import sentry_sdk

        result["sentry_initialized"] = sentry_sdk.is_initialized()

        if not sentry_sdk.is_initialized():
            return Response(
                {
                    **result,
                    "message": "Sentry SDK não está inicializado. Verifique a configuração em wsgi.py.",
                },
                status=status.HTTP_200_OK,
            )

        # Enviar mensagem de teste
        try:
            sentry_sdk.capture_message(
                "Teste de conexão GlitchTip - Mensagem de teste",
                level="info",
            )
            result["test_message_sent"] = True
        except Exception as e:
            result["test_message_error"] = str(e)

        # Enviar exceção de teste
        try:
            try:
                raise ValueError("Teste de conexão GlitchTip - Exceção de teste")
            except Exception as e:
                sentry_sdk.capture_exception(e)
            result["test_exception_sent"] = True
        except Exception as e:
            result["test_exception_error"] = str(e)

        # Flush para garantir envio
        try:
            sentry_sdk.flush(timeout=2)
        except Exception:
            pass

        return Response(
            {
                **result,
                "message": "Teste enviado com sucesso! Verifique o dashboard do GlitchTip.",
                "environment": os.environ.get("ENVIRONMENT", "unknown"),
                "release": os.environ.get("RELEASE", None),
            },
            status=status.HTTP_200_OK,
        )

    except ImportError:
        return Response(
            {
                **result,
                "message": "sentry-sdk não está instalado. Instale com: pip install sentry-sdk[django]",
            },
            status=status.HTTP_200_OK,
        )


