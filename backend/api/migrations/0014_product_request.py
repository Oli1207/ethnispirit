from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_new_features'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductRequest',
            fields=[
                ('id',          models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name',        models.CharField(blank=True, max_length=200)),
                ('email',       models.EmailField(blank=True, max_length=254)),
                ('description', models.TextField()),
                ('photo',       models.ImageField(blank=True, null=True, upload_to='product_requests/')),
                ('is_handled',  models.BooleanField(default=False)),
                ('date',        models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name':        'Demande de produit',
                'verbose_name_plural': 'Demandes de produit',
                'ordering':            ['-date'],
            },
        ),
    ]
