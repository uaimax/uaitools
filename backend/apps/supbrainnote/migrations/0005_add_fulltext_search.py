# Generated manually for full-text search optimization

from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.operations import CreateExtension
from django.db import migrations, connection


def create_pg_trgm_extension(apps, schema_editor):
    """Cria extensão pg_trgm se não existir e se for PostgreSQL."""
    if connection.vendor != 'postgresql':
        return

    with connection.cursor() as cursor:
        # Verificar se extensão já existe
        cursor.execute(
            "SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'"
        )
        if not cursor.fetchone():
            try:
                cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
            except Exception:
                # Se não tiver permissão, ignora (pode ser criada manualmente)
                pass


def reverse_create_pg_trgm_extension(apps, schema_editor):
    """Reverte criação da extensão (opcional)."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('supbrainnote', '0004_alter_note_audio_file'),
    ]

    operations = [
        # Criar extensão pg_trgm para busca com similaridade trigram
        migrations.RunPython(
            create_pg_trgm_extension,
            reverse_create_pg_trgm_extension,
        ),
        # Adicionar índice GIN para busca full-text no campo transcript
        # Nota: Este índice só funciona se pg_trgm estiver disponível
        # Se não estiver, a busca ainda funciona mas sem o índice
        migrations.AddIndex(
            model_name='note',
            index=GinIndex(
                fields=['transcript'],
                name='note_transcript_gin_idx',
                opclasses=['gin_trgm_ops'],
            ),
        ),
    ]

