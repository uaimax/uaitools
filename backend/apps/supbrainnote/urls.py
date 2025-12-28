"""URLs for supbrainnote app."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.supbrainnote.viewsets import BoxViewSet, NoteViewSet, QueryViewSet

app_name = "supbrainnote"

router = DefaultRouter()
router.register(r"boxes", BoxViewSet, basename="box")
router.register(r"notes", NoteViewSet, basename="note")
router.register(r"query", QueryViewSet, basename="query")

urlpatterns = router.urls


