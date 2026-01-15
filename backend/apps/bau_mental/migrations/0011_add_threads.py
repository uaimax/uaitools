"""Migration para adicionar modelos Thread e ThreadMessage."""

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("bau_mental", "0010_rename_app_tables"),
        ("accounts", "0005_add_updated_at_to_password_reset_token"),
    ]

    operations = [
        migrations.CreateModel(
            name="Thread",
            fields=[
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("title", models.CharField(help_text="Título da thread (gerado automaticamente ou manual)", max_length=255, verbose_name="Título")),
                ("is_global", models.BooleanField(default=False, help_text="Thread global (todas as notas)", verbose_name="Global")),
                ("pinned_summary", models.TextField(blank=True, help_text="Resposta fixada como síntese", null=True, verbose_name="Síntese fixada")),
                ("last_message_at", models.DateTimeField(auto_now=True, help_text="Atualizado automaticamente quando nova mensagem é adicionada", verbose_name="Última mensagem em")),
                ("box", models.ForeignKey(blank=True, help_text="Thread contextual de uma caixinha específica", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="threads", to="bau_mental.box", verbose_name="Caixinha")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_threads", to="accounts.user", verbose_name="Criado por")),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(class)s_set", to="accounts.workspace", verbose_name="Workspace")),
            ],
            options={
                "verbose_name": "Thread",
                "verbose_name_plural": "Threads",
                "ordering": ["-last_message_at"],
            },
        ),
        migrations.CreateModel(
            name="ThreadMessage",
            fields=[
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("role", models.CharField(choices=[("user", "Usuário"), ("assistant", "IA")], max_length=10, verbose_name="Papel")),
                ("content", models.TextField(verbose_name="Conteúdo")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="thread_messages", to="accounts.user", verbose_name="Criado por")),
                ("thread", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="bau_mental.thread", verbose_name="Thread")),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="%(class)s_set", to="accounts.workspace", verbose_name="Workspace")),
            ],
            options={
                "verbose_name": "Mensagem de Thread",
                "verbose_name_plural": "Mensagens de Threads",
                "ordering": ["created_at"],
            },
        ),
        migrations.AddField(
            model_name="thread",
            name="boxes",
            field=models.ManyToManyField(blank=True, help_text="Thread contextual de múltiplas caixinhas", related_name="multi_threads", to="bau_mental.box", verbose_name="Caixinhas"),
        ),
        migrations.AddField(
            model_name="threadmessage",
            name="notes_referenced",
            field=models.ManyToManyField(blank=True, related_name="referenced_in_messages", to="bau_mental.note", verbose_name="Notas referenciadas"),
        ),
        migrations.AddIndex(
            model_name="thread",
            index=models.Index(fields=["workspace", "box", "last_message_at"], name="bau_mental_thread_workspace_box_idx"),
        ),
        migrations.AddIndex(
            model_name="thread",
            index=models.Index(fields=["workspace", "is_global", "last_message_at"], name="bau_mental_thread_workspace_global_idx"),
        ),
        migrations.AddIndex(
            model_name="thread",
            index=models.Index(fields=["created_by"], name="bau_mental_thread_created_by_idx"),
        ),
        migrations.AddIndex(
            model_name="threadmessage",
            index=models.Index(fields=["thread", "created_at"], name="bau_mental_threadmessage_thread_idx"),
        ),
        migrations.AddIndex(
            model_name="threadmessage",
            index=models.Index(fields=["workspace", "thread"], name="bau_mental_threadmessage_workspace_idx"),
        ),
    ]
