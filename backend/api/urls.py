"""API URLs - Roteamento de versões da API."""

from django.urls import include, path

app_name = "api"

# Todas as rotas aqui já terão prefixo /api/ do config/urls.py
urlpatterns = [
    path("v1/", include("api.v1.urls")),  # Versão atual
    # path("v2/", include("api.v2.urls")),  # Futuro
]
