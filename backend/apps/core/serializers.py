"""Base serializers para APIs."""

from rest_framework import serializers


class WorkspaceSerializer(serializers.ModelSerializer):
    """Serializer base para models WorkspaceModel.

    Inclui workspace_id e timestamps automaticamente.
    """

    workspace_id = serializers.UUIDField(source="workspace.id", read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        abstract = True


class BaseSerializer(serializers.ModelSerializer):
    """Serializer base para models sem workspace (globais).

    Use WorkspaceSerializer se o model precisa de multi-tenancy.
    """

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        abstract = True


class ApplicationLogSerializer(serializers.Serializer):
    """Serializer para receber logs do frontend."""

    level = serializers.ChoiceField(choices=["ERROR", "CRITICAL"])
    message = serializers.CharField()
    error_type = serializers.CharField(required=False, allow_null=True, max_length=255)
    url = serializers.URLField(required=False, allow_null=True, max_length=500)
    stack_trace = serializers.CharField(required=False, allow_null=True)
    extra_data = serializers.JSONField(required=False, default=dict)
    session_id = serializers.CharField(required=False, allow_null=True, max_length=255)

    def validate_level(self, value):
        """Apenas aceitar ERROR e CRITICAL do frontend."""
        if value not in ["ERROR", "CRITICAL"]:
            raise serializers.ValidationError("Apenas ERROR e CRITICAL são permitidos")
        return value


class ConsoleLogSerializer(serializers.Serializer):
    """Serializer para receber logs de console do frontend (estruturado em JSON)."""

    timestamp = serializers.DateTimeField()
    level = serializers.ChoiceField(choices=["DEBUG", "INFO", "WARN", "ERROR"])
    source = serializers.CharField(default="frontend")
    message = serializers.CharField()
    data = serializers.ListField(required=False, allow_null=True, allow_empty=True)
    stack = serializers.CharField(required=False, allow_null=True)
    url = serializers.URLField(required=False, allow_null=True, max_length=500)
    userAgent = serializers.CharField(required=False, allow_null=True, source="user_agent")
    sessionId = serializers.CharField(required=False, allow_null=True, max_length=255, source="session_id")
