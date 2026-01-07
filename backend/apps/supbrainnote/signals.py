"""Signals para criar notificações automaticamente."""

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.supbrainnote.models import BoxShare, BoxShareInvite, Note


@receiver(post_save, sender=BoxShare)
def create_box_shared_notification(sender, instance: BoxShare, created: bool, **kwargs):
    """Cria notificação quando caixinha é compartilhada."""
    if created:
        from apps.core.models import Notification

        Notification.objects.create(
            user=instance.shared_with,
            type="box_shared",
            title=f"Caixinha compartilhada: {instance.box.name}",
            message=f"{instance.invited_by.email if instance.invited_by else 'Alguém'} compartilhou a caixinha '{instance.box.name}' com você.",
            related_box=instance.box,
        )


@receiver(post_save, sender=Note)
def create_note_notifications(sender, instance: Note, created: bool, **kwargs):
    """Cria notificações quando nota é criada ou editada."""
    from apps.core.models import Notification
    from apps.supbrainnote.models import BoxShare

    # Apenas para notas com caixinha
    if not instance.box:
        return

    # Buscar usuários com acesso à caixinha (compartilhados)
    shares = BoxShare.objects.filter(
        box=instance.box,
        status="accepted"
    ).exclude(
        shared_with=instance.created_by  # Não notificar o criador
    )

    if created:
        # Notificar sobre nova nota
        for share in shares:
            Notification.objects.create(
                user=share.shared_with,
                type="note_created",
                title=f"Nova nota em {instance.box.name}",
                message=f"{instance.created_by.email if instance.created_by else 'Alguém'} criou uma nova nota na caixinha '{instance.box.name}'.",
                related_box=instance.box,
                related_note=instance,
            )
    else:
        # Verificar se transcript foi atualizado
        # update_fields pode ser None quando save() é chamado sem argumentos
        update_fields = kwargs.get("update_fields") or []
        if "transcript" in update_fields:
            # Notificar sobre edição
            for share in shares:
                Notification.objects.create(
                    user=share.shared_with,
                    type="note_edited",
                    title=f"Nota editada em {instance.box.name}",
                    message=f"{instance.last_edited_by.email if instance.last_edited_by else 'Alguém'} editou uma nota na caixinha '{instance.box.name}'.",
                    related_box=instance.box,
                    related_note=instance,
                )

