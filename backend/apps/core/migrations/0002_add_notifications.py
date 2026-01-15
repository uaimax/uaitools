# Generated manually for notifications

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('accounts', '0005_add_updated_at_to_password_reset_token'),
        ('bau_mental', '0001_initial'),  # Box e Note já existem desde 0001_initial
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('box_shared', 'Caixinha compartilhada'), ('note_created', 'Nova nota criada'), ('note_edited', 'Nota editada'), ('permission_changed', 'Permissões alteradas'), ('removed_from_box', 'Removido de caixinha')], max_length=20, verbose_name='Tipo')),
                ('title', models.CharField(max_length=255, verbose_name='Título')),
                ('message', models.TextField(verbose_name='Mensagem')),
                ('read', models.BooleanField(db_index=True, default=False, verbose_name='Lida')),
                ('read_at', models.DateTimeField(blank=True, null=True, verbose_name='Lida em')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Criado em')),
                ('related_box', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='bau_mental.box', verbose_name='Caixinha relacionada')),
                ('related_note', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='bau_mental.note', verbose_name='Nota relacionada')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='accounts.user', verbose_name='Usuário')),
            ],
            options={
                'verbose_name': 'Notificação',
                'verbose_name_plural': 'Notificações',
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'read', 'created_at'], name='core_notifi_user_re_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'type', 'created_at'], name='core_notifi_user_ty_idx'),
        ),
    ]

