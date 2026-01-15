# Generated manually to rename tables from supbrainnote_* to bau_mental_*

from django.db import migrations


def rename_tables(apps, schema_editor):
    """Renomeia tabelas do banco de dados de supbrainnote_* para bau_mental_*.
    
    Se as tabelas antigas não existirem (banco novo), esta função não faz nada.
    Se o banco foi criado do zero, as tabelas já terão o nome correto (bau_mental_*).
    """
    db_alias = schema_editor.connection.alias

    with schema_editor.connection.cursor() as cursor:
        # Verificar se há tabelas antigas para renomear
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'supbrainnote_%'
        """)
        old_tables_count = cursor.fetchone()[0]
        
        if old_tables_count == 0:
            # Banco novo ou já renomeado - não fazer nada
            print("ℹ️  Nenhuma tabela antiga encontrada. Tabelas já estão com nome correto ou banco é novo.")
            return
        
        # Lista de tabelas a renomear
        tables_to_rename = [
            ('supbrainnote_box', 'bau_mental_box'),
            ('supbrainnote_note', 'bau_mental_note'),
            ('supbrainnote_boxshare', 'bau_mental_boxshare'),
            ('supbrainnote_boxshareinvite', 'bau_mental_boxshareinvite'),
        ]

        for old_name, new_name in tables_to_rename:
            # Verificar se a tabela antiga existe
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = %s
                    AND table_schema = 'public'
                )
            """, [old_name])
            table_exists = cursor.fetchone()[0]

            if table_exists:
                # Verificar se a tabela nova já existe (não renomear se já existe)
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_name = %s
                        AND table_schema = 'public'
                    )
                """, [new_name])
                new_table_exists = cursor.fetchone()[0]
                
                if not new_table_exists:
                    # Renomear a tabela
                    cursor.execute(f'ALTER TABLE {old_name} RENAME TO {new_name}')
                    print(f"✅ Tabela {old_name} renomeada para {new_name}")
                else:
                    print(f"⚠️  Tabela {new_name} já existe, pulando renomeação de {old_name}")

        # Renomear índices que começam com supbrainnote_
        cursor.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname LIKE 'supbrainnote_%'
        """)
        indexes = cursor.fetchall()

        for (index_name,) in indexes:
            new_index_name = index_name.replace('supbrainnote_', 'bau_mental_', 1)
            try:
                cursor.execute(f'ALTER INDEX IF EXISTS {index_name} RENAME TO {new_index_name}')
                print(f"✅ Índice {index_name} renomeado para {new_index_name}")
            except Exception as e:
                print(f"⚠️  Erro ao renomear índice {index_name}: {e}")

        # Renomear constraints (foreign keys, primary keys, etc.)
        cursor.execute("""
            SELECT constraint_name, table_name
            FROM information_schema.table_constraints
            WHERE constraint_name LIKE 'supbrainnote_%'
            AND table_schema = 'public'
        """)
        constraints = cursor.fetchall()

        for constraint_name, table_name in constraints:
            new_constraint_name = constraint_name.replace('supbrainnote_', 'bau_mental_', 1)
            try:
                cursor.execute(f'ALTER TABLE {table_name} RENAME CONSTRAINT {constraint_name} TO {new_constraint_name}')
                print(f"✅ Constraint {constraint_name} renomeada para {new_constraint_name}")
            except Exception as e:
                print(f"⚠️  Erro ao renomear constraint {constraint_name}: {e}")


def reverse_rename_tables(apps, schema_editor):
    """Reverte renomeação de tabelas (bau_mental_* para supbrainnote_*).
    
    Nota: Esta função só funciona se as tabelas foram renomeadas.
    Se o banco foi criado do zero com bau_mental, não há nada para reverter.
    """
    db_alias = schema_editor.connection.alias

    with schema_editor.connection.cursor() as cursor:
        # Lista de tabelas a renomear de volta
        tables_to_rename = [
            ('bau_mental_box', 'supbrainnote_box'),
            ('bau_mental_note', 'supbrainnote_note'),
            ('bau_mental_boxshare', 'supbrainnote_boxshare'),
            ('bau_mental_boxshareinvite', 'supbrainnote_boxshareinvite'),
        ]

        for old_name, new_name in tables_to_rename:
            # Verificar se a tabela existe
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = %s
                    AND table_schema = 'public'
                )
            """, [old_name])
            table_exists = cursor.fetchone()[0]

            if table_exists:
                # Verificar se a tabela de destino já existe
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_name = %s
                        AND table_schema = 'public'
                    )
                """, [new_name])
                dest_exists = cursor.fetchone()[0]
                
                if not dest_exists:
                    # Renomear a tabela de volta
                    cursor.execute(f'ALTER TABLE {old_name} RENAME TO {new_name}')
                    print(f"✅ Tabela {old_name} renomeada de volta para {new_name}")
                else:
                    print(f"⚠️  Tabela {new_name} já existe, não é possível reverter")


class Migration(migrations.Migration):

    dependencies = [
        ('bau_mental', '0009_remove_note_note_transcript_gin_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(rename_tables, reverse_rename_tables),
    ]
