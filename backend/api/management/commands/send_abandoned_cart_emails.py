"""
Management command: send_abandoned_cart_emails

Trouve les paniers abandonnés (email présent, items non vides,
checkout_started_at > 2h, abandoned_email_sent=False, aucune commande payée
dans les 24h avec cet email) et envoie un email de relance.

Usage:
    python manage.py send_abandoned_cart_emails
"""
import datetime

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from api.models import Cart, Order


class Command(BaseCommand):
    help = 'Envoie des emails de relance pour les paniers abandonnés.'

    def handle(self, *args, **options):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://ethnispirit.fr').rstrip('/')
        cart_url = f'{frontend_url}/panier'
        now = timezone.now()
        two_hours_ago = now - datetime.timedelta(hours=2)
        one_day_ago   = now - datetime.timedelta(hours=24)

        # Paniers candidates
        carts = (
            Cart.objects
            .filter(
                email__gt='',
                checkout_started_at__lte=two_hours_ago,
                abandoned_email_sent=False,
            )
            .prefetch_related('items__product')
        )

        if not carts.exists():
            self.stdout.write('Aucun panier abandonné à relancer.')
            return

        sent_count = 0
        skipped_count = 0
        error_count = 0

        for cart in carts:
            # Ignorer si le panier est vide
            if not cart.items.exists():
                skipped_count += 1
                continue

            # Ignorer si l'utilisateur a déjà passé une commande payée dans les 24h
            recent_paid = Order.objects.filter(
                email__iexact=cart.email,
                status='paid',
                date__gte=one_day_ago,
            ).exists()
            if recent_paid:
                skipped_count += 1
                continue

            # Construire la liste des articles
            items_lines = '\n'.join(
                f'  - {item.product.name if item.product else item.product_id} × {item.quantity}'
                for item in cart.items.all()
            )

            subject = 'Vous avez oublié quelque chose ! — EthniSpirit'
            message = (
                f'Bonjour,\n\n'
                f'Vous avez laissé des articles dans votre panier EthniSpirit.\n\n'
                f'Articles en attente :\n{items_lines}\n\n'
                f'Votre panier vous attend :\n{cart_url}\n\n'
                f'Les stocks étant limités, nous ne pouvons pas vous garantir leur disponibilité indéfiniment.\n\n'
                f'À bientôt,\nL\'équipe EthniSpirit\ncontact@ethnispirit.fr'
            )

            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[cart.email],
                    fail_silently=False,
                )
                Cart.objects.filter(pk=cart.pk).update(abandoned_email_sent=True)
                sent_count += 1
                self.stdout.write(f'  Relance envoyée à {cart.email} (panier {cart.cart_id})')
            except Exception as e:
                error_count += 1
                self.stderr.write(f'  Erreur pour {cart.email} (panier {cart.cart_id}): {e}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Terminé — {sent_count} email(s) envoyé(s), '
                f'{skipped_count} ignoré(s), {error_count} erreur(s).'
            )
        )
