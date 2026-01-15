"""Admin configuration for bau_mental app."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from apps.bau_mental.models import Box, Note, BoxShare, BoxShareInvite, Thread, ThreadMessage


@admin.register(Box)
class BoxAdmin(admin.ModelAdmin):
    """Admin para modelo Box."""

    list_display = ["name", "workspace", "note_count", "color", "created_at"]
    list_filter = ["workspace", "created_at"]
    search_fields = ["name", "description", "keywords"]
    readonly_fields = ["created_at", "updated_at", "note_count", "last_note_at", "summary", "summary_generated_at", "summary_stale"]
    date_hierarchy = "created_at"

    fieldsets = (
        (_("Informações Básicas"), {"fields": ("workspace", "name", "color", "description", "keywords")}),
        (_("Cache"), {"fields": ("note_count", "last_note_at", "summary", "summary_generated_at", "summary_stale")}),
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


@admin.register(BoxShare)
class BoxShareAdmin(admin.ModelAdmin):
    """Admin para modelo BoxShare."""

    list_display = ["box", "shared_with", "permission", "status", "created_at", "accepted_at"]
    list_filter = ["permission", "status", "created_at"]
    search_fields = ["box__name", "shared_with__email"]
    readonly_fields = ["created_at", "accepted_at"]
    date_hierarchy = "created_at"


@admin.register(BoxShareInvite)
class BoxShareInviteAdmin(admin.ModelAdmin):
    """Admin para modelo BoxShareInvite."""

    list_display = ["box", "email", "permission", "expires_at", "created_at"]
    list_filter = ["permission", "expires_at", "created_at"]
    search_fields = ["box__name", "email"]
    readonly_fields = ["token", "created_at"]
    date_hierarchy = "created_at"


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    """Admin para modelo Thread."""

    list_display = ["title", "workspace", "box", "is_global", "created_by", "last_message_at", "created_at"]
    list_filter = ["is_global", "workspace", "created_at"]
    search_fields = ["title"]
    readonly_fields = ["created_at", "updated_at", "last_message_at"]
    date_hierarchy = "created_at"
    filter_horizontal = ["boxes"]


@admin.register(ThreadMessage)
class ThreadMessageAdmin(admin.ModelAdmin):
    """Admin para modelo ThreadMessage."""

    list_display = ["thread", "role", "created_by", "created_at"]
    list_filter = ["role", "thread", "created_at"]
    search_fields = ["content", "thread__title"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"
    filter_horizontal = ["notes_referenced"]



