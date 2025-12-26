"""ViewSets para buscar erros do GlitchTip/Sentry via API."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from apps.core.services.glitchtip_client import (
    get_glitchtip_errors,
    get_glitchtip_issue_details,
)


class GlitchTipViewSet(ViewSet):
    """ViewSet para buscar erros do GlitchTip/Sentry via API REST.

    Requer:
    - USE_SENTRY=true
    - SENTRY_DSN configurado
    - SENTRY_API_TOKEN (opcional, mas recomendado para autenticação)

    Endpoints:
    - GET /api/v1/glitchtip/errors/ - Lista últimos erros
    - GET /api/v1/glitchtip/errors/{issue_id}/ - Detalhes de um erro
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="errors")
    def list_errors(self, request) -> Response:
        """Lista os últimos erros do GlitchTip/Sentry.

        Query params:
        - limit: Número máximo de erros (padrão: 50)
        - query: Query string para filtrar (opcional)
        - stats_period: Período para estatísticas (padrão: "24h")
        """
        try:
            limit = int(request.query_params.get("limit", 50))
            query = request.query_params.get("query")
            stats_period = request.query_params.get("stats_period", "24h")

            result = get_glitchtip_errors(
                limit=limit,
                query=query,
                stats_period=stats_period,
            )

            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Erro ao buscar erros do GlitchTip: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="errors/(?P<issue_id>[^/.]+)")
    def get_error_details(self, request, issue_id: str) -> Response:
        """Retorna detalhes de um erro específico.

        Args:
            issue_id: ID do erro (issue) no GlitchTip/Sentry
        """
        try:
            if not issue_id:
                return Response(
                    {"error": "issue_id é obrigatório"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = get_glitchtip_issue_details(issue_id)

            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Erro ao buscar detalhes do erro: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

