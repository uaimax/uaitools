# Generated manually - Remove old models before creating new ones

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('investments', '0009_migrate_existing_data'),
    ]

    operations = [
        migrations.DeleteModel(
            name='DividendHistory',
        ),
        migrations.DeleteModel(
            name='MarketPriceHistory',
        ),
        migrations.DeleteModel(
            name='PortfolioSnapshot',
        ),
        migrations.DeleteModel(
            name='Recommendation',
        ),
        migrations.DeleteModel(
            name='Strategy',
        ),
    ]
