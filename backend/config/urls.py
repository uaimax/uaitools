"""URL configuration for config project."""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Admin URL prefix - configurável via ADMIN_URL_PREFIX (padrão: "manage")
# Usar prefixo customizado aumenta segurança (evita ataques diretos em /admin/)
admin_prefix = getattr(settings, "ADMIN_URL_PREFIX", "manage")

urlpatterns = [
    # Admin - prefixo customizável via ADMIN_URL_PREFIX
    path(f"{admin_prefix}/", admin.site.urls),
    # API routes - SEMPRE com prefixo /api/
    # Quando separar serviços, nginx pode fazer proxy de /api/* para backend
    path("api/", include("api.urls"), name="api"),
]

# Servir arquivos de mídia em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Nota: Catch-all para SPA será adicionado na Fase 4 quando frontend for implementado
# e apenas se rodar tudo no mesmo serviço

