# Generated manually for full-text search with tsvector

from django.contrib.postgres.indexes import GinIndex
from django.db import migrations, connection


def create_search_vector_column(apps, schema_editor):
    """Cria coluna search_vector gerada automaticamente usando tsvector."""
    if connection.vendor != 'postgresql':
        return

    with connection.cursor() as cursor:
        # Verificar se coluna já existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='bau_mental_note' AND column_name='search_vector'
        """)
        if cursor.fetchone():
            return  # Já existe, não criar novamente

        # Criar coluna search_vector gerada automaticamente
        cursor.execute("""
            ALTER TABLE bau_mental_note 
            ADD COLUMN search_vector tsvector 
            GENERATED ALWAYS AS (
                to_tsvector('portuguese', 
                    coalesce(transcript, '')
                )
            ) STORED;
        """)


def reverse_create_search_vector_column(apps, schema_editor):
    """Remove coluna search_vector."""
    if connection.vendor != 'postgresql':
        return

    with connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE bau_mental_note DROP COLUMN IF EXISTS search_vector;
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('bau_mental', '0012_rename_supbrainnot_workspa_e64862_idx_bau_mental__workspa_1af3f2_idx_and_more'),
    ]

    operations = [
        # Criar coluna tsvector gerada automaticamente no PostgreSQL
        migrations.RunSQL(
            sql="""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='bau_mental_note' AND column_name='search_vector'
                    ) THEN
                        ALTER TABLE bau_mental_note 
                        ADD COLUMN search_vector tsvector 
                        GENERATED ALWAYS AS (
                            to_tsvector('portuguese', 
                                coalesce(transcript, '')
                            )
                        ) STORED;
                    END IF;
                END $$;
            """,
            reverse_sql="""
                ALTER TABLE bau_mental_note DROP COLUMN IF EXISTS search_vector;
            """,
        ),
        # Criar índice GIN para busca rápida
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS note_search_vector_gin_idx 
                ON bau_mental_note USING GIN (search_vector);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS note_search_vector_gin_idx;
            """,
        ),
    ]
