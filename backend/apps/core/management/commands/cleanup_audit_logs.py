"""Comando para limpar logs de auditoria antigos conforme política LGPD.

Este comando deve ser executado periodicamente (ex: via cron) para manter
a política de retenção de dados conforme LGPD.

Uso:
    python manage.py cleanup_audit_logs
    python manage.py cleanup_audit_logs --dry-run  # Simular sem deletar
    python manage.py cleanup_audit_logs --days 365  # Override configuração
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.core.models import AuditLog


class Command(BaseCommand):
    """Comando para limpar logs de auditoria antigos."""

    help = "Remove logs de auditoria mais antigos que a política de retenção LGPD"

    def add_arguments(self, parser) -> None:
        """Adiciona argumentos ao comando."""
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simula a execução sem deletar logs",
        )
        parser.add_argument(
            "--days",
            type=int,
            help="Override: número de dias para manter (padrão: AUDIT_LOG_RETENTION_DAYS)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Força execução mesmo se retenção < 365 dias (não recomendado)",
        )

    def handle(self, *args, **options) -> None:
        """Executa a limpeza de logs."""
        from django.conf import settings

        # Determinar dias de retenção
        retention_days = options.get("days") or getattr(
            settings, "AUDIT_LOG_RETENTION_DAYS", 1095
        )

        # Validação de segurança
        if retention_days < 365 and not options.get("force"):
            self.stdout.write(
                self.style.ERROR(
                    f"❌ Retenção de {retention_days} dias é menor que o mínimo legal LGPD (365 dias).\n"
                    "Use --force para forçar (NÃO RECOMENDADO)."
                )
            )
            return

        # Calcular data de corte
        cutoff_date = timezone.now() - timedelta(days=retention_days)

        # Buscar logs antigos
        old_logs = AuditLog.objects.filter(created_at__lt=cutoff_date)
        count = old_logs.count()

        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Nenhum log antigo encontrado (retenção: {retention_days} dias)"
                )
            )
            return

        # Exibir informações
        self.stdout.write(
            self.style.WARNING(
                f"📊 Logs a serem removidos: {count:,}\n"
                f"📅 Data de corte: {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"⏱️  Retenção: {retention_days} dias"
            )
        )

        if options.get("dry_run"):
            self.stdout.write(
                self.style.WARNING("🔍 DRY RUN - Nenhum log foi deletado")
            )
            return

        # Confirmar (em produção, considerar adicionar confirmação interativa)
        self.stdout.write(
            self.style.WARNING(
                f"⚠️  Deletando {count:,} logs de auditoria..."
            )
        )

        # Deletar logs antigos
        deleted = old_logs.delete()

        # Resultado
        deleted_count = deleted[0] if isinstance(deleted, tuple) else deleted
        self.stdout.write(
            self.style.SUCCESS(
                f"✅ {deleted_count:,} logs de auditoria removidos com sucesso"
            )
        )

        # Estatísticas finais
        remaining = AuditLog.objects.count()
        self.stdout.write(
            f"📊 Logs restantes: {remaining:,}\n"
            f"💾 Espaço liberado: ~{self._estimate_space_freed(deleted_count)} MB"
        )

    def _estimate_space_freed(self, count: int) -> float:
        """Estima espaço liberado (aproximado)."""
        # Estimativa: ~500 bytes por log em média
        return round((count * 500) / (1024 * 1024), 2)




