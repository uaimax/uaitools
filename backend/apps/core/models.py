"""Base models for the application."""

import uuid
from typing import Optional

from django.db import models

from apps.core.managers import SoftDeleteModel


class UUIDPrimaryKeyMixin(models.Model):
    """Mixin para usar UUID como primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class WorkspaceModel(SoftDeleteModel):
    """Base model com workspace_id e timestamps.

    Todos os models que precisam de multi-tenancy devem herdar desta classe.
    Inclui soft delete automático.
    """

    workspace = models.ForeignKey(
        "accounts.Workspace",
        on_delete=models.CASCADE,
        related_name="%(class)s_set",
        verbose_name="Workspace",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=["workspace"]),
            models.Index(fields=["workspace", "deleted_at"]),
        ]


class BaseModel(SoftDeleteModel):
    """Base model sem workspace_id (para models globais).

    Use WorkspaceModel se o model precisa de multi-tenancy.
    Inclui soft delete automático.
    """

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    class Meta:
        abstract = True


class AuditLog(UUIDPrimaryKeyMixin, models.Model):
    """Log de auditoria para compliance LGPD.

    Registra TODAS as mudanças em dados pessoais:
    - QUEM fez a mudança (user_id)
    - QUANDO (timestamp)
    - O QUÊ (valores antigos e novos)
    - Model e campo alterados
    """

    ACTION_CHOICES = [
        ("create", "Criação"),
        ("update", "Atualização"),
        ("delete", "Exclusão"),
        ("view", "Visualização"),  # Para acesso a dados sensíveis
    ]

    # Identificação
    workspace = models.ForeignKey(
        "accounts.Workspace",
        on_delete=models.CASCADE,
        related_name="audit_logs",
        verbose_name="Workspace",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        verbose_name="Usuário",
        null=True,
        blank=True,
    )

    # O que foi alterado
    action = models.CharField(
        max_length=20, choices=ACTION_CHOICES, verbose_name="Ação"
    )
    model_name = models.CharField(max_length=255, verbose_name="Model")
    object_id = models.CharField(max_length=255, verbose_name="ID do Objeto")
    field_name = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Campo"
    )

    # Valores
    old_value = models.TextField(null=True, blank=True, verbose_name="Valor Antigo")
    new_value = models.TextField(null=True, blank=True, verbose_name="Valor Novo")

    # Metadados
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, verbose_name="Endereço IP"
    )
    user_agent = models.TextField(null=True, blank=True, verbose_name="User Agent")
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Data/Hora", db_index=True
    )

    # Dados pessoais identificados
    is_personal_data = models.BooleanField(
        default=False, verbose_name="Dados Pessoais", db_index=True
    )
    data_subject = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Titular dos Dados",
        help_text="Email ou identificador do titular dos dados",
    )

    class Meta:
        verbose_name = "Log de Auditoria"
        verbose_name_plural = "Logs de Auditoria"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "created_at"]),
            models.Index(fields=["workspace", "is_personal_data", "created_at"]),
            models.Index(fields=["model_name", "object_id"]),
            models.Index(fields=["data_subject", "created_at"]),
        ]

    def __str__(self) -> str:
        """Representação string do log."""
        user_str = self.user.username if self.user else "Sistema"
        return f"{self.get_action_display()} {self.model_name}#{self.object_id} por {user_str} em {self.created_at}"


class ApplicationLog(UUIDPrimaryKeyMixin, WorkspaceModel):
    """Log de erros da aplicação (fallback quando Sentry não configurado).

    Armazena apenas erros críticos (ERROR, CRITICAL) quando Sentry não está
    configurado. Se Sentry estiver configurado, os logs vão direto para lá.
    """

    LEVEL_CHOICES = [
        ("ERROR", "Error"),
        ("CRITICAL", "Critical"),
    ]

    SOURCE_CHOICES = [
        ("frontend", "Frontend"),
        ("backend", "Backend"),
    ]

    level = models.CharField(
        max_length=10, choices=LEVEL_CHOICES, db_index=True, verbose_name="Nível"
    )
    source = models.CharField(
        max_length=20, choices=SOURCE_CHOICES, db_index=True, verbose_name="Origem"
    )
    message = models.TextField(verbose_name="Mensagem")
    error_type = models.CharField(
        max_length=255, null=True, blank=True, db_index=True, verbose_name="Tipo de Erro"
    )
    url = models.URLField(
        null=True, blank=True, max_length=500, verbose_name="URL"
    )
    stack_trace = models.TextField(null=True, blank=True, verbose_name="Stack Trace")
    extra_data = models.JSONField(default=dict, blank=True, verbose_name="Dados Extras")
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application_logs",
        verbose_name="Usuário",
    )
    session_id = models.CharField(
        max_length=255, null=True, blank=True, db_index=True, verbose_name="ID da Sessão"
    )
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, verbose_name="Endereço IP"
    )
    user_agent = models.TextField(null=True, blank=True, verbose_name="User Agent")

    class Meta:
        verbose_name = "Log de Aplicação"
        verbose_name_plural = "Logs de Aplicação"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "level", "created_at"]),
            models.Index(fields=["workspace", "source", "created_at"]),
            models.Index(fields=["created_at"]),  # Para cleanup
        ]

    def __str__(self) -> str:
        """Representação string do log."""
        return f"{self.level} - {self.source} - {self.message[:50]}"

