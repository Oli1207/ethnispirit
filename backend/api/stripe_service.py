"""
Stripe Checkout Session — EthniSpirit
Doc : https://stripe.com/docs/payments/checkout
Installation : pip install stripe
"""
try:
    import stripe
except ImportError:
    raise ImportError(
        "Le package 'stripe' est manquant. Lance : pip install stripe"
    )
from django.conf import settings


def _init():
    """Initialise la clé API Stripe depuis les settings Django."""
    stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(order) -> stripe.checkout.Session:
    """
    Crée une Stripe Checkout Session pour la commande donnée.
    Retourne la session (contient .id et .url pour la redirection).
    """
    _init()
    session = stripe.checkout.Session.create(
        customer_email       = order.email,
        payment_method_types = ['card'],
        line_items = [
            {
                'price_data': {
                    'currency':     'eur',
                    'product_data': {
                        'name':        f'Commande EthniSpirit {order.oid}',
                        'description': f'Livraison {order.country} — {order.full_name}',
                    },
                    'unit_amount': int(order.total * 100),   # Stripe : centimes
                },
                'quantity': 1,
            }
        ],
        mode        = 'payment',
        success_url = (
            f'{settings.FRONTEND_URL}/paiement-succes'
            f'?oid={order.oid}'
            f'&session_id={{CHECKOUT_SESSION_ID}}'
        ),
        cancel_url  = f'{settings.FRONTEND_URL}/paiement-echec',
        metadata    = {
            'order_oid':   order.oid,
            'destination': order.country,
        },
    )
    return session


def retrieve_session(session_id: str) -> stripe.checkout.Session:
    _init()
    return stripe.checkout.Session.retrieve(session_id)
