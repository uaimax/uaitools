"""URLs para application logs."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.core.viewsets import ApplicationLogViewSet

app_name = "logging"

router = DefaultRouter()
router.register(r"", ApplicationLogViewSet, basename="application-log")

urlpatterns = router.urls



