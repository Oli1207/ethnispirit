from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_productreview'),
    ]

    operations = [
        migrations.CreateModel(
            name='ShippingZone',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('destinations', models.TextField(
                    help_text='Destinations séparées par virgule (ex: Martinique, Fort-de-France)'
                )),
                ('cost', models.DecimalField(decimal_places=2, max_digits=8)),
                ('free_above', models.DecimalField(
                    decimal_places=2, default=0,
                    help_text='Livraison gratuite si sous-total >= ce montant (0 = jamais gratuit)',
                    max_digits=8,
                )),
                ('days_min', models.PositiveSmallIntegerField(default=3)),
                ('days_max', models.PositiveSmallIntegerField(default=7)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Zone de livraison',
                'verbose_name_plural': 'Zones de livraison',
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='order',
            name='shipping_cost',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
    ]
