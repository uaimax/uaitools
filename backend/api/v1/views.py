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


