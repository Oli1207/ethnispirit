from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_welcome_promo_settings'),
    ]

    operations = [
        # ── PromoCode : champ universe ────────────────────────────────────────
        migrations.AddField(
            model_name='promocode',
            name='universe',
            field=models.CharField(
                choices=[
                    ('mode', 'Mode Antillaise uniquement'),
                    ('bio',  'Bio & Naturel uniquement'),
                    ('all',  'Tous les univers'),
                ],
                default='all',
                max_length=10,
                help_text="Détermine sur quel(s) article(s) la réduction s'applique",
            ),
        ),

        # ── Order : FK mode ───────────────────────────────────────────────────
        migrations.AddField(
            model_name='order',
            name='promo_code_mode',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='orders_mode',
                to='api.promocode',
            ),
        ),

        # ── Order : FK bio ────────────────────────────────────────────────────
        migrations.AddField(
            model_name='order',
            name='promo_code_bio',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='orders_bio',
                to='api.promocode',
            ),
        ),

        # ── Order : discount_mode ─────────────────────────────────────────────
        migrations.AddField(
            model_name='order',
            name='discount_mode',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),

        # ── Order : discount_bio ──────────────────────────────────────────────
        migrations.AddField(
            model_name='order',
            name='discount_bio',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),

        # ── Order : related_name sur l'ancien promo_code FK ───────────────────
        migrations.AlterField(
            model_name='order',
            name='promo_code',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='orders_legacy',
                to='api.promocode',
            ),
        ),
    ]
