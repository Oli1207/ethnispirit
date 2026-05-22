from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_welcomepromosettings_universe'),
    ]

    operations = [
        # ── Order : review_email_sent ─────────────────────────────────────────
        migrations.AddField(
            model_name='order',
            name='review_email_sent',
            field=models.BooleanField(default=False),
        ),

        # ── Cart : panier abandonné ───────────────────────────────────────────
        migrations.AddField(
            model_name='cart',
            name='email',
            field=models.EmailField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='cart',
            name='checkout_started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cart',
            name='abandoned_email_sent',
            field=models.BooleanField(default=False),
        ),

        # ── StockAlertSettings ────────────────────────────────────────────────
        migrations.CreateModel(
            name='StockAlertSettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('threshold', models.IntegerField(default=5, help_text='Seuil en dessous duquel alerter')),
                ('email', models.EmailField(blank=True, help_text='Email de notification (laisser vide pour désactiver)')),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Paramètres alertes stock',
                'verbose_name_plural': 'Paramètres alertes stock',
            },
        ),

        # ── RestockNotification ───────────────────────────────────────────────
        migrations.CreateModel(
            name='RestockNotification',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField()),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('notified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='restock_notifications',
                    to='api.product',
                )),
            ],
            options={
                'verbose_name': 'Notification réapprovisionnement',
                'verbose_name_plural': 'Notifications réapprovisionnement',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='restocknotification',
            unique_together={('product', 'email')},
        ),
    ]
