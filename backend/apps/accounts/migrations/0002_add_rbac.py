# Generated manually for RBAC implementation

import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Excluído em')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('name', models.CharField(max_length=100, verbose_name='Nome')),
                ('description', models.TextField(blank=True, verbose_name='Descrição')),
                ('permissions', models.JSONField(default=list, help_text="Array de strings no formato 'module.action'", verbose_name='Permissões')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='role_set', to='accounts.workspace', verbose_name='Workspace')),
            ],
            options={
                'verbose_name': 'Role',
                'verbose_name_plural': 'Roles',
                'ordering': ['name'],
                'unique_together': {('workspace', 'name')},
            },
        ),
        migrations.AddField(
            model_name='user',
            name='roles',
            field=models.ManyToManyField(blank=True, related_name='users', to='accounts.role', verbose_name='Roles'),
        ),
    ]

