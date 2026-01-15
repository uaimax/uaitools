# Generated manually for box cache fields (note_count, last_note_at, summary cache)

from django.db import migrations, models, connection


def create_update_box_note_count_trigger(apps, schema_editor):
    """Cria trigger PostgreSQL para atualizar note_count e last_note_at automaticamente."""
    if connection.vendor != 'postgresql':
        return

    with connection.cursor() as cursor:
        # Criar função (considera soft delete via deleted_at)
        cursor.execute("""
            CREATE OR REPLACE FUNCTION update_box_note_count()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    IF NEW.box_id IS NOT NULL AND NEW.deleted_at IS NULL THEN
                        UPDATE bau_mental_box
                        SET note_count = note_count + 1,
                            last_note_at = NEW.created_at
                        WHERE id = NEW.box_id;
                    END IF;
                ELSIF TG_OP = 'DELETE' THEN
                    IF OLD.box_id IS NOT NULL AND OLD.deleted_at IS NULL THEN
                        UPDATE bau_mental_box
                        SET note_count = GREATEST(0, note_count - 1)
                        WHERE id = OLD.box_id;
                    END IF;
                ELSIF TG_OP = 'UPDATE' THEN
                    -- Soft delete (deleted_at mudou de NULL para NOT NULL)
                    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
                        IF OLD.box_id IS NOT NULL THEN
                            UPDATE bau_mental_box
                            SET note_count = GREATEST(0, note_count - 1)
                            WHERE id = OLD.box_id;
                        END IF;
                    -- Restore (deleted_at mudou de NOT NULL para NULL)
                    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
                        IF NEW.box_id IS NOT NULL THEN
                            UPDATE bau_mental_box
                            SET note_count = note_count + 1,
                                last_note_at = NEW.created_at
                            WHERE id = NEW.box_id;
                        END IF;
                    -- Mudança de caixinha
                    ELSIF OLD.box_id != NEW.box_id AND NEW.deleted_at IS NULL THEN
                        IF OLD.box_id IS NOT NULL AND OLD.deleted_at IS NULL THEN
                            UPDATE bau_mental_box 
                            SET note_count = GREATEST(0, note_count - 1) 
                            WHERE id = OLD.box_id;
                        END IF;
                        IF NEW.box_id IS NOT NULL THEN
                            UPDATE bau_mental_box 
                            SET note_count = note_count + 1, 
                                last_note_at = NEW.created_at 
                            WHERE id = NEW.box_id;
                        END IF;
                    END IF;
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        """)

        # Criar trigger (inclui deleted_at para soft delete)
        cursor.execute("""
            DROP TRIGGER IF EXISTS trigger_update_box_note_count ON bau_mental_note;
            CREATE TRIGGER trigger_update_box_note_count
            AFTER INSERT OR DELETE OR UPDATE OF box_id, deleted_at ON bau_mental_note
            FOR EACH ROW EXECUTE FUNCTION update_box_note_count();
        """)

        # Popular contagens iniciais (considera apenas notas não deletadas)
        cursor.execute("""
            UPDATE bau_mental_box b
            SET note_count = COALESCE((
                SELECT COUNT(*) 
                FROM bau_mental_note n 
                WHERE n.box_id = b.id AND n.deleted_at IS NULL
            ), 0),
            last_note_at = (
                SELECT MAX(created_at)
                FROM bau_mental_note n
                WHERE n.box_id = b.id AND n.deleted_at IS NULL
            );
        """)


def reverse_create_update_box_note_count_trigger(apps, schema_editor):
    """Remove trigger e função."""
    if connection.vendor != 'postgresql':
        return

    with connection.cursor() as cursor:
        cursor.execute("DROP TRIGGER IF EXISTS trigger_update_box_note_count ON bau_mental_note;")
        cursor.execute("DROP FUNCTION IF EXISTS update_box_note_count();")


class Migration(migrations.Migration):

    dependencies = [
        ('bau_mental', '0014_add_box_keywords'),
    ]

    operations = [
        # Adicionar campos de cache
        migrations.AddField(
            model_name='box',
            name='note_count',
            field=models.IntegerField(
                default=0,
                help_text='Contagem em cache (atualizada via trigger)',
                verbose_name='Contagem de notas',
            ),
        ),
        migrations.AddField(
            model_name='box',
            name='last_note_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Data da última nota adicionada (atualizada via trigger)',
                null=True,
                verbose_name='Última nota em',
            ),
        ),
        migrations.AddField(
            model_name='box',
            name='summary',
            field=models.TextField(
                blank=True,
                help_text='Resumo gerado por IA (cacheado)',
                null=True,
                verbose_name='Resumo',
            ),
        ),
        migrations.AddField(
            model_name='box',
            name='summary_generated_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name='Resumo gerado em',
            ),
        ),
        migrations.AddField(
            model_name='box',
            name='summary_stale',
            field=models.BooleanField(
                default=False,
                help_text='True se resumo precisa ser regenerado',
                verbose_name='Resumo desatualizado',
            ),
        ),
        # Criar trigger
        migrations.RunPython(
            create_update_box_note_count_trigger,
            reverse_create_update_box_note_count_trigger,
        ),
    ]
