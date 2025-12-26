"""Admin configuration for supbrainnote app."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from apps.supbrainnote.models import Box, Note


@admin.register(Box)
class BoxAdmin(admin.ModelAdmin):
    """Admin para modelo Box."""

    list_display = ["name", "workspace", "notes_count", "color", "created_at"]
    list_filter = ["workspace", "created_at"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        (_("Informações Básicas"), {"fields": ("workspace", "name", "color", "description")}),
        (_("Datas"), {"fields": ("created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        """Filtra caixinhas por workspace se não for superuser."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, "workspace") and request.user.workspace:
            return qs.filter(workspace=request.user.workspace)
        return qs.none()

    def notes_count(self, obj: Box) -> int:
        """Retorna quantidade de anotações."""
        return obj.notes_count

    notes_count.short_description = "Anotações"


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    """Admin para modelo Note."""

    list_display = [
        "id",
        "box",
        "source_type",
        "processing_status",
        "ai_confidence",
        "created_at",
    ]
    list_filter = ["source_type", "processing_status", "box", "workspace", "created_at"]
    search_fields = ["transcript", "box__name"]
    readonly_fields = [
        "created_at",
        "updated_at",
        "processing_status",
        "ai_confidence",
        "duration_seconds",
        "file_size_bytes",
    ]
    date_hierarchy = "created_at"

    fieldsets = (
        (_("Informações Básicas"), {"fields": ("workspace", "box", "source_type")}),
        (_("Conteúdo"), {"fields": ("audio_file", "transcript")}),
        (
            _("Processamento"),
            {
                "fields": (
                    "processing_status",
                    "ai_confidence",
                    "duration_seconds",
                    "file_size_bytes",
                )
            },
        ),
        (_("Metadados"), {"fields": ("metadata",)}),
        (_("Datas"), {"fields": ("created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        """Filtra anotações por workspace se não for superuser."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, "workspace") and request.user.workspace:
            return qs.filter(workspace=request.user.workspace)
        return qs.none()

