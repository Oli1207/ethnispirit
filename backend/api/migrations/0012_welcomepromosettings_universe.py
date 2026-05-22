from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_alter_welcomepromosettings_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='welcomepromosettings',
            name='universe',
            field=models.CharField(
                choices=[
                    ('all',  'Tous les univers'),
                    ('mode', 'Mode Antillaise'),
                    ('bio',  'Bio & Naturel'),
                ],
                default='all',
                max_length=10,
                verbose_name="Univers d'affichage",
                help_text='Sur quel site afficher ce modal',
            ),
        ),
    ]
