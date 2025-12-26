"""Admin configuration for core app - Audit Logs."""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from apps.core.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin para logs de auditoria LGPD."""

    list_display = [
        "created_at",
        "action",
        "model_name",
        "field_name",
        "user",
        "is_personal_data_badge",
        "data_subject",
        "ip_address",
    ]
    list_filter = [
        "action",
        "is_personal_data",
        "model_name",
        "created_at",
        "workspace",
    ]
    search_fields = [
        "model_name",
        "object_id",
        "field_name",
        "user__username",
        "user__email",
        "data_subject",
        "ip_address",
    ]
    readonly_fields = [
        "workspace",
        "user",
        "action",
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
    date_hierarchy = "created_at"
    ordering = ["-created_at"]

    fieldsets = (
        (_("Identificação"), {"fields": ("workspace", "user", "action", "created_at")}),
        (
            _("Objeto Alterado"),
            {"fields": ("model_name", "object_id", "field_name")},
        ),
        (_("Valores"), {"fields": ("old_value", "new_value")}),
        (
            _("Dados Pessoais (LGPD)"),
            {"fields": ("is_personal_data", "data_subject")},
        ),
        (_("Metadados"), {"fields": ("ip_address", "user_agent")}),
    )

    def is_personal_data_badge(self, obj: AuditLog) -> str:
        """Exibe badge para dados pessoais."""
        if obj.is_personal_data:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">LGPD</span>'
            )
        return format_html('<span style="color: #6c757d;">-</span>')

    is_personal_data_badge.short_description = "Dados Pessoais"

    def get_queryset(self, request):
        """Filtra logs por workspace se não for superuser."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, "workspace") and request.user.workspace:
            return qs.filter(workspace=request.user.workspace)
        return qs.none()

    def has_add_permission(self, request) -> bool:
        """Logs de auditoria não podem ser criados manualmente."""
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        """Logs de auditoria não podem ser alterados."""
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        """Logs de auditoria só podem ser deletados por superusers (com cuidado!)."""
        return request.user.is_superuser

