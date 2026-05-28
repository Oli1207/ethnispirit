from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_merge_20260523_2025'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── StaffProfile ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name='StaffProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(
                    choices=[
                        ('delivery',   'Livraison'),
                        ('catalog',    'Catalogue'),
                        ('support',    'Service client'),
                        ('accounting', 'Comptabilité'),
                        ('superadmin', 'Super Admin'),
                    ],
                    default='support',
                    max_length=20,
                )),
                ('extra_permissions', models.JSONField(
                    blank=True,
                    default=dict,
                    help_text='Surcharge individuelle des permissions (clé: perm_name, valeur: True/False)',
                )),
                ('notify_universes', models.JSONField(
                    blank=True,
                    default=list,
                    help_text='Univers pour lesquels recevoir des notifications push ([] = tous)',
                )),
                ('is_active', models.BooleanField(default=True)),
                ('date_created', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='staff_profile',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='created_staff',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Profil staff',
                'verbose_name_plural': 'Profils staff',
            },
        ),

        # ── PushSubscription ──────────────────────────────────────────────────
        migrations.CreateModel(
            name='PushSubscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('endpoint', models.TextField(unique=True)),
                ('p256dh', models.TextField()),
                ('auth_key', models.TextField()),
                ('universes', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='push_subscriptions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Abonnement push',
                'verbose_name_plural': 'Abonnements push',
            },
        ),
    ]
