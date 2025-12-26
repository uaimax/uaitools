"""URLs para audit logs."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.core.audit_viewsets import AuditLogViewSet

app_name = "audit"

router = DefaultRouter()
router.register(r"logs", AuditLogViewSet, basename="audit-log")

urlpatterns = router.urls




