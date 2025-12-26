# Generated manually for password reset functionality

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_add_rbac'),
    ]

    operations = [
        migrations.CreateModel(
            name='PasswordResetToken',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Criado em')),
                ('token', models.UUIDField(db_index=True, default=uuid.uuid4, help_text='Token único para reset de senha', unique=True, verbose_name='Token')),
                ('expires_at', models.DateTimeField(db_index=True, verbose_name='Expira em')),
                ('used_at', models.DateTimeField(blank=True, help_text='Data/hora em que o token foi usado para resetar a senha', null=True, verbose_name='Usado em')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='password_reset_tokens', to='accounts.user', verbose_name='Usuário')),
                ('workspace', models.ForeignKey(blank=True, help_text='Workspace do usuário (opcional, pode ser None)', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='password_reset_tokens', to='accounts.workspace', verbose_name='Workspace')),
            ],
            options={
                'verbose_name': 'Token de Reset de Senha',
                'verbose_name_plural': 'Tokens de Reset de Senha',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='passwordresettoken',
            index=models.Index(fields=['token', 'used_at'], name='accounts_p_token_used_idx'),
        ),
        migrations.AddIndex(
            model_name='passwordresettoken',
            index=models.Index(fields=['user', 'used_at'], name='accounts_p_user_id_used_idx'),
        ),
        migrations.AddIndex(
            model_name='passwordresettoken',
            index=models.Index(fields=['expires_at'], name='accounts_p_expires_idx'),
        ),
    ]

