"""URLs for bau_mental app."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.bau_mental.viewsets import BoxViewSet, NoteViewSet, QueryViewSet, ThreadViewSet
from apps.bau_mental.views import accept_box_invite, verify_box_invite_token

app_name = "bau_mental"

router = DefaultRouter()
router.register(r"boxes", BoxViewSet, basename="box")
router.register(r"notes", NoteViewSet, basename="note")
router.register(r"query", QueryViewSet, basename="query")
router.register(r"threads", ThreadViewSet, basename="thread")

urlpatterns = router.urls + [
    path("invites/verify/", verify_box_invite_token, name="verify-box-invite-token"),
    path("invites/accept/", accept_box_invite, name="accept-box-invite"),
]



