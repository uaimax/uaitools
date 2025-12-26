"""Tasks relacionadas a logging."""

import os
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.core.models import ApplicationLog


@shared_task
def cleanup_old_logs():
    """Remove logs mais antigos que o período de retenção.

    Retenção padrão: 7 dias (configurável via LOG_RETENTION_DAYS).
    """
    retention_days = int(os.environ.get("LOG_RETENTION_DAYS", "7"))
    cutoff_date = timezone.now() - timedelta(days=retention_days)

    deleted_count, _ = ApplicationLog.objects.filter(
        created_at__lt=cutoff_date
    ).delete()

    return f"Deleted {deleted_count} old logs"



