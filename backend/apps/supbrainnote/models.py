"""Models for supbrainnote app."""

import os
from datetime import timedelta
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from apps.core.models import WorkspaceModel, UUIDPrimaryKeyMixin


def audio_upload_path(instance: "Note", filename: str) -> str:
    """Gera caminho de upload para arquivo de áudio."""
    # Formato: supbrainnote/audios/{workspace_id}/{year}/{month}/{day}/{filename}
    from django.utils import timezone
    import uuid

    # Usar workspace_id diretamente (não requer que o objeto workspace esteja carregado)
    workspace_id = str(instance.workspace_id) if instance.workspace_id else "unknown"
    # Usar data atual (created_at ainda não existe no momento do upload)
    date = timezone.now()
    # Adicionar UUID ao filename para evitar colisões
    name, ext = os.path.splitext(filename)
    unique_filename = f"{uuid.uuid4()}{ext}"
    return os.path.join(
        "supbrainnote",
        "audios",
        workspace_id,
        date.strftime("%Y"),
        date.strftime("%m"),
        date.strftime("%d"),
        unique_filename,
    )


class Box(UUIDPrimaryKeyMixin, WorkspaceModel):
    """Caixinha (categoria) para organizar anotações."""

    name = models.CharField(max_length=255, verbose_name=_("Nome"))
    color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name=_("Cor"),
        help_text=_("Cor em hexadecimal (ex: #FF5733)"),
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Descrição"),
    )

    class Meta:
        verbose_name = _("Caixinha")
        verbose_name_plural = _("Caixinhas")
        ordering = ["name"]
        indexes = [
            models.Index(fields=["workspace", "name"]),
        ]

    def __str__(self) -> str:
        """Representação string da caixinha."""
        return f"{self.name} ({self.workspace.name})"

    @property
    def notes_count(self) -> int:
        """Retorna quantidade de anotações na caixinha."""
        return self.notes.filter(deleted_at__isnull=True).count()


class Note(UUIDPrimaryKeyMixin, WorkspaceModel):
    """Anotação criada a partir de áudio."""

    SOURCE_CHOICES = [
        ("memo", _("Memo próprio")),
        ("group_audio", _("Áudio de grupo")),
        ("forwarded", _("Áudio encaminhado")),
    ]

    PROCESSING_STATUS_CHOICES = [
        ("pending", _("Pendente")),
        ("processing", _("Processando")),
        ("completed", _("Concluído")),
        ("failed", _("Falhou")),
    ]

    # Relacionamentos
    box = models.ForeignKey(
        "supbrainnote.Box",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes",
        verbose_name=_("Caixinha"),
    )

    # Conteúdo
    # Importar storage aqui para garantir que seja uma instância
    from apps.supbrainnote.storage import SupBrainNoteAudioStorage
    audio_file = models.FileField(
        upload_to=audio_upload_path,
        verbose_name=_("Arquivo de áudio"),
        storage=SupBrainNoteAudioStorage(),
    )
    transcript = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Transcrição"),
    )

    # Metadados
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="memo",
        verbose_name=_("Tipo de origem"),
    )
    processing_status = models.CharField(
        max_length=20,
        choices=PROCESSING_STATUS_CHOICES,
        default="pending",
        verbose_name=_("Status de processamento"),
    )
    ai_confidence = models.FloatField(
        null=True,
        blank=True,
        verbose_name=_("Confiança da IA"),
        help_text=_("Confiança da classificação (0-1)"),
    )

    # Metadados do áudio
    duration_seconds = models.FloatField(
        null=True,
        blank=True,
        verbose_name=_("Duração (segundos)"),
    )
    file_size_bytes = models.IntegerField(
        null=True,
        blank=True,
        verbose_name=_("Tamanho do arquivo (bytes)"),
    )

    # Metadados extras (JSON)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Metadados extras"),
    )

    class Meta:
        verbose_name = _("Anotação")
        verbose_name_plural = _("Anotações")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "box", "created_at"]),
            models.Index(fields=["workspace", "processing_status"]),
            models.Index(fields=["workspace", "box", "processing_status"]),
        ]

    def __str__(self) -> str:
        """Representação string da anotação."""
        box_name = self.box.name if self.box else "Inbox"
        return f"{box_name} - {self.created_at.strftime('%d/%m/%Y %H:%M')}"

    @property
    def is_in_inbox(self) -> bool:
        """Verifica se anotação está na inbox (sem caixinha)."""
        return self.box is None

    @property
    def is_audio_expired(self) -> bool:
        """Verifica se o áudio está próximo do vencimento (7 dias)."""
        if not self.created_at:
            return False
        expiration_date = self.created_at + timedelta(days=7)
        return timezone.now() >= expiration_date

    @property
    def days_until_expiration(self) -> int:
        """Retorna quantos dias faltam para o áudio expirar."""
        if not self.created_at:
            return 0
        expiration_date = self.created_at + timedelta(days=7)
        delta = expiration_date - timezone.now()
        return max(0, delta.days)

    def save(self, *args, **kwargs) -> None:
        """Salva anotação e atualiza metadados do arquivo."""
        if self.audio_file and not self.file_size_bytes:
            # Atualizar tamanho do arquivo
            try:
                self.file_size_bytes = self.audio_file.size
            except (OSError, ValueError):
                pass
        super().save(*args, **kwargs)

