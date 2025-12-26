"""Admin configuration for accounts app."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Workspace, LegalDocument, LegalDocumentAcceptance, User, Role


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    """Admin para modelo Workspace."""

    list_display = ["name", "slug", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "slug", "legal_name", "cnpj"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (_("Informações Básicas"), {"fields": ("name", "slug", "is_active")}),
        (_("Dados do Workspace"), {
            "fields": (
                "legal_name",
                "cnpj",
                "address",
                "city",
                "state",
                "phone",
                "email",
                "website",
            ),
            "classes": ("collapse",),
        }),
        (_("DPO (Encarregado de Proteção de Dados)"), {
            "fields": (
                "dpo_name",
                "dpo_email",
                "dpo_phone",
                "dpo_address",
            ),
            "classes": ("collapse",),
        }),
        (_("Outros"), {"fields": ("support_hours",)}),
        (_("Datas"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    """Admin para modelo LegalDocument."""

    list_display = ["document_type", "version", "is_active", "last_updated"]
    list_filter = ["document_type", "is_active"]
    search_fields = ["content"]
    readonly_fields = ["created_at", "last_updated"]

    fieldsets = (
        (_("Informações Básicas"), {"fields": ("document_type", "version", "is_active")}),
        (_("Conteúdo"), {
            "fields": ("content",),
            "description": _(
                "Use variáveis como [NOME DO SISTEMA], [NOME DA EMPRESA], [CNPJ], [E-MAIL DE CONTATO], etc. "
                "Também suporta formato {{variavel}} para compatibilidade. "
                "Os valores são substituídos pelas configurações globais do SaaS (settings)."
            ),
        }),
        (_("Datas"), {"fields": ("created_at", "last_updated")}),
    )


@admin.register(LegalDocumentAcceptance)
class LegalDocumentAcceptanceAdmin(admin.ModelAdmin):
    """Admin para modelo LegalDocumentAcceptance."""

    list_display = ["user", "document", "workspace", "accepted_at", "ip_address"]
    list_filter = ["document__document_type", "workspace", "accepted_at"]
    search_fields = ["user__email", "ip_address"]
    readonly_fields = ["accepted_at", "user", "document", "workspace", "ip_address", "user_agent"]
    date_hierarchy = "accepted_at"

    fieldsets = (
        (_("Informações Básicas"), {"fields": ("user", "document", "workspace")}),
        (_("Detalhes da Aceitação"), {"fields": ("accepted_at", "ip_address", "user_agent")}),
    )

    def has_add_permission(self, request):
        """Não permitir criação manual de aceitações (apenas via registro)."""
        return False

    def has_change_permission(self, request, obj=None):
        """Não permitir edição de aceitações (são imutáveis)."""
        return False


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Admin para modelo Role."""

    list_display = ["name", "workspace", "permissions_count", "created_at"]
    list_filter = ["workspace", "created_at"]
    search_fields = ["name", "description", "workspace__name"]
    readonly_fields = ["created_at", "updated_at"]
    filter_horizontal = []

    fieldsets = (
        (_("Informações Básicas"), {"fields": ("name", "workspace", "description")}),
        (_("Permissões"), {
            "fields": ("permissions",),
            "description": _(
                "Array de strings no formato 'module.action'. "
                "Exemplos: 'leads.view', 'leads.create', 'admin.*', '*'"
            ),
        }),
        (_("Datas"), {"fields": ("created_at", "updated_at")}),
    )

    def permissions_count(self, obj):
        """Retorna quantidade de permissões do role."""
        return len(obj.permissions or [])
    permissions_count.short_description = _("Permissões")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin para modelo User customizado."""

    list_display = ["email", "first_name", "last_name", "workspace", "is_staff", "is_active", "created_at"]
    list_filter = ["workspace", "is_staff", "is_active", "created_at"]
    search_fields = ["email", "first_name", "last_name", "workspace__name"]
    readonly_fields = ["created_at", "updated_at"]
    filter_horizontal = ["roles"]

    fieldsets = BaseUserAdmin.fieldsets + (
        (_("Workspace"), {"fields": ("workspace",)}),
        (_("Roles"), {"fields": ("roles",)}),
        (_("Datas"), {"fields": ("created_at", "updated_at")}),
    )

