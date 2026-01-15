# Generated manually for box sharing (BoxShare, BoxShareInvite)

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('bau_mental', '0007_add_note_tracking'),
        ('accounts', '0005_add_updated_at_to_password_reset_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='BoxShare',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('permission', models.CharField(choices=[('read', 'Leitura'), ('write', 'Leitura e Escrita')], default='read', max_length=10, verbose_name='Permissão')),
                ('status', models.CharField(choices=[('pending', 'Pendente'), ('accepted', 'Aceito')], default='pending', max_length=10, verbose_name='Status')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('accepted_at', models.DateTimeField(blank=True, null=True, verbose_name='Aceito em')),
                ('box', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shares', to='bau_mental.box', verbose_name='Caixinha')),
                ('invited_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='box_invites_sent', to='accounts.user', verbose_name='Convidado por')),
                ('shared_with', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shared_boxes', to='accounts.user', verbose_name='Compartilhado com')),
            ],
            options={
                'verbose_name': 'Compartilhamento de Caixinha',
                'verbose_name_plural': 'Compartilhamentos de Caixinhas',
            },
        ),
        migrations.CreateModel(
            name='BoxShareInvite',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(max_length=254, verbose_name='Email')),
                ('permission', models.CharField(choices=[('read', 'Leitura'), ('write', 'Leitura e Escrita')], default='read', max_length=10, verbose_name='Permissão')),
                ('token', models.UUIDField(db_index=True, default=uuid.uuid4, unique=True, verbose_name='Token')),
                ('expires_at', models.DateTimeField(verbose_name='Expira em')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('box', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pending_invites', to='bau_mental.box', verbose_name='Caixinha')),
                ('invited_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='box_email_invites_sent', to='accounts.user', verbose_name='Convidado por')),
            ],
            options={
                'verbose_name': 'Convite de Caixinha',
                'verbose_name_plural': 'Convites de Caixinhas',
            },
        ),
        migrations.AddIndex(
            model_name='boxshare',
            index=models.Index(fields=['box', 'shared_with', 'status'], name='supbrainnot_box_shar_idx'),
        ),
        migrations.AddIndex(
            model_name='boxshare',
            index=models.Index(fields=['shared_with', 'status'], name='supbrainnot_shared__idx'),
        ),
        migrations.AddIndex(
            model_name='boxshareinvite',
            index=models.Index(fields=['email', 'token'], name='supbrainnot_email_to_idx'),
        ),
        migrations.AddIndex(
            model_name='boxshareinvite',
            index=models.Index(fields=['expires_at'], name='supbrainnot_expires_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='boxshare',
            unique_together={('box', 'shared_with')},
        ),
        migrations.AlterUniqueTogether(
            name='boxshareinvite',
            unique_together={('box', 'email')},
        ),
    ]

