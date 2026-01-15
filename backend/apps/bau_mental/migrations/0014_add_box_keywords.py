# Generated manually for box keywords field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bau_mental', '0013_add_search_vector_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='box',
            name='keywords',
            field=models.CharField(
                blank=True,
                help_text='Palavras-chave separadas por vírgula (ex: evento, festa, réveillon)',
                max_length=500,
                null=True,
                verbose_name='Palavras-chave',
            ),
        ),
    ]
