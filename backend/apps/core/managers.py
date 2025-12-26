"""Managers customizados para soft delete."""

from django.db import models
from django.utils import timezone


class SoftDeleteManager(models.Manager):
    """Manager que filtra automaticamente registros deletados."""

    def get_queryset(self):
        """Retorna queryset excluindo registros deletados."""
        return super().get_queryset().filter(deleted_at__isnull=True)

    def with_deleted(self):
        """Retorna queryset incluindo deletados."""
        return super().get_queryset()

    def only_deleted(self):
        """Retorna apenas registros deletados."""
        return super().get_queryset().filter(deleted_at__isnull=False)


class SoftDeleteModel(models.Model):
    """Mixin para adicionar soft delete a qualquer model."""

    deleted_at = models.DateTimeField(
        null=True, blank=True, db_index=True, verbose_name="Excluído em"
    )

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Acesso sem filtro

    def soft_delete(self) -> None:
        """Marca como deletado."""
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self) -> None:
        """Restaura registro deletado."""
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    @property
    def is_deleted(self) -> bool:
        """Verifica se o registro está deletado."""
        return self.deleted_at is not None

    class Meta:
        abstract = True




