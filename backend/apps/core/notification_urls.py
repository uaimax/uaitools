"""URLs para notificações."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.core.viewsets import NotificationViewSet

app_name = "notifications"

# Router para gerar rotas padrão do ViewSet
router = DefaultRouter(trailing_slash=True)
router.register(r"", NotificationViewSet, basename="notification")

# As rotas geradas serão:
# - GET /api/v1/notifications/ - list
# - GET /api/v1/notifications/{id}/ - retrieve
# - PATCH /api/v1/notifications/{id}/read/ - mark_as_read
# - POST /api/v1/notifications/mark-all-read/ - mark_all_read
# - POST /api/v1/notifications/{id}/dismiss-box/ - dismiss_box_notifications
urlpatterns = router.urls

