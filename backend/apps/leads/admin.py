"""Admin configuration for leads app."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from apps.leads.models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    """Admin para modelo Lead."""

    list_display = ["name", "email", "workspace", "client_workspace", "status", "source", "created_at"]
    list_filter = ["status", "source", "workspace", "created_at"]
    search_fields = ["name", "email", "client_workspace", "phone"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        (_("Informações Básicas"), {"fields": ("workspace", "name", "email", "phone", "client_workspace")}),
        (_("Status e Origem"), {"fields": ("status", "source")}),
        (_("Observações"), {"fields": ("notes",)}),
        (_("Datas"), {"fields": ("created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        """Filtra leads por workspace se não for superuser."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, "workspace") and request.user.workspace:
            return qs.filter(workspace=request.user.workspace)
        return qs.none()

