"""
Helper SumUp — crée un checkout via l'API REST SumUp.
Doc : https://developer.sumup.com/api/checkouts/create/
"""
import requests
from django.conf import settings


SUMUP_API_BASE = 'https://api.sumup.com/v0.1'


SUMUP_HOSTED_URL = 'https://pay.sumup.com/b2c/{checkout_id}'


def create_checkout(order, redirect_url: str = None) -> dict:
    """
    Crée un checkout SumUp pour la commande donnée.
    Retourne le dict enrichi avec 'hosted_checkout_url'.
    Lève une exception requests.HTTPError si la création échoue.
    """
    final_redirect = redirect_url or settings.SUMUP_REDIRECT_URL
    url = f'{SUMUP_API_BASE}/checkouts'
    payload = {
        'checkout_reference': order.oid,
        'amount':             float(order.total),
        'currency':           'EUR',
        'merchant_code':      settings.SUMUP_MERCHANT_CODE,
        'description':        f'Commande EthniSpirit {order.oid}',
        'redirect_url':       final_redirect,
    }
    headers = {
        'Authorization': f'Bearer {settings.SUMUP_API_KEY}',
        'Content-Type':  'application/json',
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    data['hosted_checkout_url'] = SUMUP_HOSTED_URL.format(checkout_id=data['id'])
    return data


def get_checkout(checkout_id: str) -> dict:
    """
    Récupère l'état d'un checkout SumUp.
    """
    url = f'{SUMUP_API_BASE}/checkouts/{checkout_id}'
    headers = {'Authorization': f'Bearer {settings.SUMUP_API_KEY}'}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    return resp.json()
