"""
Throttle classes personnalisés pour les endpoints sensibles.
Utilisés avec @throttle_classes([LoginThrottle]) sur les vues concernées.
"""
from rest_framework.throttling import AnonRateThrottle


class LoginThrottle(AnonRateThrottle):
    """Max 10 tentatives de connexion par minute par IP."""
    scope = 'login'


class PasswordResetThrottle(AnonRateThrottle):
    """Max 5 demandes de reset mot de passe par minute par IP."""
    scope = 'password_reset'


class PromoCheckThrottle(AnonRateThrottle):
    """Max 30 vérifications de code promo par minute par IP."""
    scope = 'promo'
