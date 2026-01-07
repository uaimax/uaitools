"""Serializers for core app."""

from rest_framework import serializers

from apps.accounts.models import Workspace
from apps.core.models import ApplicationLog, Notification


class WorkspaceSerializer(serializers.ModelSerializer):
    """Serializer para modelo Workspace."""

    class Meta:
        model = Workspace
        fields = ["id", "name", "slug", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ApplicationLogSerializer(serializers.ModelSerializer):
    """Serializer para ApplicationLog."""

    class Meta:
        model = ApplicationLog
        fields = [
            "level",
            "source",
            "message",
            "error_type",
            "url",
            "stack_trace",
            "extra_data",
            "session_id",
        ]


class ConsoleLogSerializer(serializers.Serializer):
    """Serializer para logs de console do frontend."""

    level = serializers.ChoiceField(choices=["DEBUG", "INFO", "WARN", "ERROR"])
    message = serializers.CharField()
    category = serializers.CharField(required=False, allow_blank=True)
    data = serializers.JSONField(required=False, default=dict)


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificações."""

    type_display = serializers.CharField(source="get_type_display", read_only=True)
    related_box_name = serializers.CharField(source="related_box.name", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "type_display",
            "title",
            "message",
            "related_box",
            "related_box_name",
            "related_note",
            "read",
            "read_at",
            "created_at",
        ]
        read_only_fields = ["id", "read", "read_at", "created_at"]
