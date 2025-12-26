"""URLs para GlitchTip/Sentry API."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.core.glitchtip_viewsets import GlitchTipViewSet

app_name = "glitchtip"

router = DefaultRouter()
router.register(r"", GlitchTipViewSet, basename="glitchtip")

urlpatterns = router.urls


