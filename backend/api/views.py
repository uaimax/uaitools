"""Views da API.

DEPRECATED: Este arquivo foi movido para api/v1/views.py.
Mantido apenas para referência. Use api/v1/views.py para novas implementações.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
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
            "openapi_schema": "/api/schema/",
            "swagger_ui": "/api/schema/swagger-ui/",
            "redoc": "/api/schema/redoc/",
        },
        status=status.HTTP_200_OK,
    )

