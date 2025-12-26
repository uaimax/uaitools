"""Serializers for leads app."""

from rest_framework import serializers

from apps.core.serializers import WorkspaceSerializer
from apps.leads.models import Lead


class LeadSerializer(WorkspaceSerializer):
    """Serializer para modelo Lead."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "workspace_id",
            "name",
            "email",
            "phone",
            "client_workspace",
            "status",
            "status_display",
            "notes",
            "source",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace_id", "created_at", "updated_at"]


class LeadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de leads."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "name",
            "email",
            "client_workspace",
            "status",
            "status_display",
            "source",
            "created_at",
        ]

