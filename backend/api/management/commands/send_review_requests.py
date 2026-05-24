"""
Management command: send_review_requests

Trouve les commandes livrées depuis >= 7 jours dont l'email de demande d'avis
n'a pas encore été envoyé, envoie un email par commande avec un lien vers chaque
produit acheté, puis marque review_email_sent=True.

Usage:
    python manage.py send_review_requests
"""
import datetime

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from api.models import Order, ProductReview


class Command(BaseCommand):
    help = 'Envoie des emails de demande d\'avis aux clients livrés depuis 7 jours.'

    def handle(self, *args, **options):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://ethnispirit.com').rstrip('/')
        cutoff = timezone.now() - datetime.timedelta(days=7)

        # Commandes livrées depuis >= 7j, email non envoyé
        orders = (
            Order.objects
            .filter(
                status='delivered',
                date__lte=cutoff,
                review_email_sent=False,
            )
            .exclude(email='')
            .prefetch_related('items__product')
        )

        if not orders.exists():
            self.stdout.write('Aucune demande d\'avis à envoyer.')
            return

        sent_count = 0
        error_count = 0

        for order in orders:
            # Construire la liste des produits pour lesquels l'avis n'a pas encore été donné
            product_lines = []
            for item in order.items.all():
                if item.product_id is None:
                    continue
                # Vérifier si l'utilisateur a déjà laissé un avis
                already_reviewed = False
                if order.user_id:
                    already_reviewed = ProductReview.objects.filter(
                        user_id=order.user_id,
                        product_id=item.product_id,
                    ).exists()
                if not already_reviewed:
                    product_url = f'{frontend_url}/produit/{item.product.slug}' if item.product else ''
                    product_lines.append(f'  - {item.product_name} : {product_url}')

            if not product_lines:
                # Tous les produits ont déjà un avis — on marque quand même pour ne plus retraiter
                Order.objects.filter(pk=order.pk).update(review_email_sent=True)
                continue

            products_str = '\n'.join(product_lines)
            subject = f'Votre avis nous intéresse — commande {order.oid}'
            message = (
                f'Bonjour {order.full_name},\n\n'
                f'Nous espérons que vous êtes satisfait(e) de votre commande {order.oid} '
                f'passée le {order.date.strftime("%d/%m/%Y")}.\n\n'
                f'Votre avis aide nos autres clients à faire les bons choix. '
                f'Cela ne prend que quelques secondes !\n\n'
                f'Donnez votre avis sur :\n{products_str}\n\n'
                f'Merci pour votre confiance,\n'
                f'L\'équipe EthniSpirit\nsupport@ethnispirit.com'
            )

            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[order.email],
                    fail_silently=False,
                )
                Order.objects.filter(pk=order.pk).update(review_email_sent=True)
                sent_count += 1
                self.stdout.write(f'  Email avis envoyé à {order.email} pour commande {order.oid}')
            except Exception as e:
                error_count += 1
                self.stderr.write(f'  Erreur pour {order.email} ({order.oid}): {e}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Terminé — {sent_count} email(s) envoyé(s), {error_count} erreur(s).'
            )
        )
