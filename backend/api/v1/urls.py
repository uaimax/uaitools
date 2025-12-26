"""API URLs v1 - Todas as rotas da versão 1 da API devem estar aqui."""

from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from api.v1.views import api_info, dashboard_stats_view, health_check

app_name = "api_v1"

# Todas as rotas aqui já terão prefixo /api/v1/ do api/urls.py
urlpatterns = [
    # Health check e info
    path("health/", health_check, name="health"),
    path("info/", api_info, name="info"),
    # Dashboard
    path("dashboard/stats/", dashboard_stats_view, name="dashboard-stats"),
    # Apps
    path("", include("apps.accounts.urls")),  # Autenticação e tenants
    path("leads/", include("apps.leads.urls")),
    # Auditoria LGPD
    path("audit/", include("apps.core.audit_urls")),
    # Logging (erros da aplicação)
    path("logs/", include("apps.core.logging_urls")),
    # GlitchTip/Sentry API (buscar erros)
    path("glitchtip/", include("apps.core.glitchtip_urls")),
    # OpenAPI Schema
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="api_v1:schema"), name="swagger-ui"),
    path("schema/redoc/", SpectacularRedocView.as_view(url_name="api_v1:schema"), name="redoc"),
]


