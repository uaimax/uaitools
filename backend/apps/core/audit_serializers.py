"""Serializers para audit logs."""

from rest_framework import serializers

from apps.core.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de auditoria."""

    user_username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    workspace_name = serializers.CharField(source="workspace.name", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "workspace",
            "workspace_name",
            "user",
            "user_username",
            "user_email",
            "action",
            "action_display",
            "model_name",
            "object_id",
            "field_name",
            "old_value",
            "new_value",
            "ip_address",
            "user_agent",
            "is_personal_data",
            "data_subject",
            "created_at",
        ]
        read_only_fields = fields


class AuditLogListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de logs."""

    user_username = serializers.CharField(source="user.username", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "action",
            "action_display",
            "model_name",
            "field_name",
            "user_username",
            "is_personal_data",
            "data_subject",
            "created_at",
        ]

