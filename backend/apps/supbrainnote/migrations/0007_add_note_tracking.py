# Generated manually for note tracking (created_by, last_edited_by, last_edited_at)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('supbrainnote', '0006_add_forwarded_source_type'),
        ('accounts', '0005_add_updated_at_to_password_reset_token'),
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_notes',
                to='accounts.user',
                verbose_name='Criado por',
            ),
        ),
        migrations.AddField(
            model_name='note',
            name='last_edited_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='edited_notes',
                to='accounts.user',
                verbose_name='Última edição por',
            ),
        ),
        migrations.AddField(
            model_name='note',
            name='last_edited_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Última edição em'),
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['created_by'], name='supbrainnot_created_idx'),
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['last_edited_by'], name='supbrainnot_last_edi_idx'),
        ),
    ]

