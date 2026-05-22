from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_analytics_and_utm'),
    ]

    operations = [
        migrations.CreateModel(
            name='WelcomePromoSettings',
            fields=[
                ('id',            models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active',     models.BooleanField(default=True, verbose_name='Actif')),
                ('title',         models.CharField(default='Bienvenue !', max_length=200, verbose_name='Titre')),
                ('subtitle',      models.CharField(default='1ère commande', max_length=300, verbose_name='Sous-titre')),
                ('promo_code',    models.CharField(default='ETHNI10', max_length=50, verbose_name='Code promo')),
                ('discount_text', models.CharField(default='10% de réduction', max_length=100, verbose_name='Texte réduction')),
                ('body_text',     models.TextField(blank=True, default='', verbose_name='Texte complémentaire')),
                ('delay_seconds', models.PositiveIntegerField(default=3, verbose_name='Délai avant affichage (s)')),
            ],
            options={
                'verbose_name': 'Modal de bienvenue',
                'verbose_name_plural': 'Modal de bienvenue',
            },
        ),
    ]
