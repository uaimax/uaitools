"""URLs for leads app."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.leads.viewsets import LeadViewSet

app_name = "leads"

router = DefaultRouter()
router.register(r"", LeadViewSet, basename="lead")

urlpatterns = router.urls

