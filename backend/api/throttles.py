"""
Limitation de débit (throttling) par IP.

Deux niveaux :
 1. Plafonds GLOBAUX larges (rafale par minute + soutenu par heure) — ils stoppent les
    robots/scrapers sans gêner un vrai visiteur qui enchaîne les pages. Ils remplacent
    l'ancien plafond de 300 requêtes/heure, trop bas : un SPA fait ~8 appels API par page,
    ce qui coupait un client après ~35 pages (et tout un foyer partageant la même IP).
 2. Plafonds STRICTS par endpoint sensible (connexion, commande, contact, suivi…).

Les compteurs vivent dans le cache Django : en production il est partagé entre les
processus (FileBasedCache, voir settings/production.py).
"""
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle


# ── 1. Plafonds globaux (classes par défaut de REST_FRAMEWORK) ─────────────────
class AnonBurstThrottle(AnonRateThrottle):
    scope = 'anon_burst'


class AnonSustainedThrottle(AnonRateThrottle):
    scope = 'anon_sustained'


class UserBurstThrottle(UserRateThrottle):
    scope = 'user_burst'


class UserSustainedThrottle(UserRateThrottle):
    scope = 'user_sustained'


# ── 2. Endpoints sensibles ────────────────────────────────────────────────────
class _IPThrottle(SimpleRateThrottle):
    """Clé = IP du client (que la requête soit anonyme ou connectée)."""

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}


class LoginThrottle(AnonRateThrottle):
    """Max 10 tentatives de connexion par minute par IP (brute force)."""
    scope = 'login'


class PasswordResetThrottle(AnonRateThrottle):
    """Max 5 demandes de reset mot de passe par minute par IP."""
    scope = 'password_reset'


class PromoCheckThrottle(AnonRateThrottle):
    """Max 30 vérifications de code promo par minute par IP (devinette de codes)."""
    scope = 'promo'


class RegisterThrottle(_IPThrottle):
    scope = 'register'          # création de comptes en masse


class OrderCreateThrottle(_IPThrottle):
    scope = 'order_create'      # création de commandes / checkouts SumUp


class OrderTrackThrottle(_IPThrottle):
    scope = 'order_track'       # devinette oid + email


class OrderVerifyThrottle(_IPThrottle):
    scope = 'order_verify'      # page de retour de paiement (sondage SumUp)


class ContactThrottle(_IPThrottle):
    scope = 'contact'           # formulaire de contact (spam + emails sortants)


class NewsletterThrottle(_IPThrottle):
    scope = 'newsletter'


class ProductRequestThrottle(_IPThrottle):
    scope = 'product_request'   # demande de produit (upload de photo)


class RestockThrottle(_IPThrottle):
    scope = 'restock'


class TrackingThrottle(_IPThrottle):
    scope = 'tracking'          # analytics (plusieurs appels par page)


class CartWriteThrottle(_IPThrottle):
    scope = 'cart_write'
