"""Management command para limpar notas órfãs (de caixinhas deletadas)."""

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.bau_mental.models import Box, Note


class Command(BaseCommand):
    """Soft delete de notas que pertencem a caixinhas deletadas."""

    help = "Faz soft delete de notas que pertencem a caixinhas já deletadas"

    def add_arguments(self, parser):
        """Adiciona argumentos do comando."""
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Apenas mostra o que seria feito, sem executar",
        )

    def handle(self, *args, **options):
        """Executa a limpeza."""
        dry_run = options["dry_run"]

        # Buscar notas que pertencem a caixinhas deletadas
        # Usando all_objects para incluir caixinhas deletadas na busca
        deleted_boxes = Box.all_objects.filter(deleted_at__isnull=False)
        deleted_box_ids = list(deleted_boxes.values_list("id", flat=True))

        self.stdout.write(f"Caixinhas deletadas encontradas: {len(deleted_box_ids)}")

        if not deleted_box_ids:
            self.stdout.write(self.style.SUCCESS("Nenhuma caixinha deletada encontrada."))
            return

        # Buscar notas dessas caixinhas que ainda não foram deletadas
        orphan_notes = Note.objects.filter(
            box_id__in=deleted_box_ids,
            deleted_at__isnull=True,
        )
        orphan_count = orphan_notes.count()

        self.stdout.write(f"Notas órfãs encontradas: {orphan_count}")

        if orphan_count == 0:
            self.stdout.write(self.style.SUCCESS("Nenhuma nota órfã encontrada."))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"[DRY RUN] Seriam soft-deletadas {orphan_count} notas:"
            ))
            for note in orphan_notes[:10]:
                box = Box.all_objects.get(id=note.box_id)
                self.stdout.write(f"  - Nota {note.id} (caixinha: {box.name})")
            if orphan_count > 10:
                self.stdout.write(f"  ... e mais {orphan_count - 10} notas")
        else:
            # Executar soft delete
            now = timezone.now()
            updated = orphan_notes.update(deleted_at=now)
            self.stdout.write(self.style.SUCCESS(
                f"Soft delete realizado em {updated} notas órfãs."
            ))

