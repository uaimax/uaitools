"""Celery configuration for Django."""

import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("saas_bootstrap")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Beat schedule para tarefas periódicas
app.conf.beat_schedule = {
    "cleanup-old-logs": {
        "task": "apps.core.tasks.logging.cleanup_old_logs",
        "schedule": crontab(hour=2, minute=0),  # Todo dia às 2h
    },
    "supbrainnote-cleanup-expired-audios": {
        "task": "apps.supbrainnote.tasks.cleanup_expired_audios",
        "schedule": crontab(hour=3, minute=0),  # Todo dia às 3h
    },
    # Background jobs do módulo de investimentos
    "investments.update_market_data": {
        "task": "investments.update_market_data",
        "schedule": crontab(minute="*/5", hour="10-17"),  # A cada 5 min durante pregão (10h-17h)
    },
    "investments.revalidate_strategies": {
        "task": "investments.revalidate_strategies",
        "schedule": crontab(hour=18, minute=0),  # Diário às 18h (após fechamento)
    },
    "investments.calculate_performance": {
        "task": "investments.calculate_performance",
        "schedule": crontab(day_of_week=0, hour=20, minute=0),  # Semanal (domingo, 20h)
    },
    "investments.analyze_profiles": {
        "task": "investments.analyze_profiles",
        "schedule": crontab(day_of_week=0, hour=21, minute=0),  # Semanal (domingo, 21h)
    },
    "investments.cleanup_cache": {
        "task": "investments.cleanup_cache",
        "schedule": crontab(hour=2, minute=0),  # Diário às 2h
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Task de debug para testar Celery."""
    print(f"Request: {self.request!r}")


