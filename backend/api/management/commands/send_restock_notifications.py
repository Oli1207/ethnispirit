"""
Management command: send_restock_notifications

Trouve les produits dont le stock > 0 et les RestockNotification non notifiées,
envoie un email à chaque abonné, puis marque notified=True.

Usage:
    python manage.py send_restock_notifications
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings

from api.models import RestockNotification


class Command(BaseCommand):
    help = 'Envoie des emails de notification de réapprovisionnement aux abonnés.'

    def handle(self, *args, **options):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://ethnispirit.fr').rstrip('/')

        # Notifications non envoyées pour des produits disponibles
        notifications = (
            RestockNotification.objects
            .filter(notified=False, product__stock__gt=0, product__is_active=True)
            .select_related('product')
        )

        if not notifications.exists():
            self.stdout.write('Aucune notification à envoyer.')
            return

        sent_count = 0
        error_count = 0

        for notif in notifications:
            product = notif.product
            product_url = f'{frontend_url}/produit/{product.slug}'

            subject = f'[EthniSpirit] "{product.name}" est de nouveau disponible !'
            message = (
                f'Bonjour,\n\n'
                f'Bonne nouvelle ! Le produit que vous suivez est de nouveau en stock :\n\n'
                f'  {product.name}\n'
                f'  Stock disponible : {product.stock} unité(s)\n\n'
                f'Commandez dès maintenant avant rupture :\n{product_url}\n\n'
                f'À bientôt,\nL\'équipe EthniSpirit\ncontact@ethnispirit.fr'
            )

            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[notif.email],
                    fail_silently=False,
                )
                notif.notified = True
                notif.save(update_fields=['notified'])
                sent_count += 1
                self.stdout.write(f'  Email envoyé à {notif.email} pour "{product.name}"')
            except Exception as e:
                error_count += 1
                self.stderr.write(f'  Erreur pour {notif.email} ({product.name}): {e}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Terminé — {sent_count} email(s) envoyé(s), {error_count} erreur(s).'
            )
        )
