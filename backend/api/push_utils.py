"""
Utilitaires Web Push pour les notifications staff.
Nécessite : pywebpush dans requirements.txt
"""
import json
import logging

logger = logging.getLogger(__name__)


def send_push_to_staff(title, body, url='/', universe=None, event_type=None, icon=None):
    """
    Envoie une notification push à tous les membres du staff actifs
    qui ont une souscription push enregistrée.

    Args:
        title        : Titre de la notification
        body         : Corps du message
        url          : URL vers laquelle naviguer au clic (relatif ou absolu)
        universe     : 'mode' | 'bio' | None  — filtre selon les préférences du staff
        event_type   : type d'événement (ex: 'new_order', 'new_contact', …)
        icon         : URL de l'icône (optionnel)
    """
    try:
        from pywebpush import webpush, WebPushException
        from django.conf import settings
        from .models import PushSubscription, StaffProfile
        from userauths.models import User
    except ImportError as e:
        logger.warning(f'push_utils: import error — {e}')
        return []

    payload = json.dumps({
        'title':      title,
        'body':       body,
        'url':        url,
        'event_type': event_type or '',
        'icon':       icon or '/icons/icon-192x192.png',
    })

    # ── Collecter les souscriptions éligibles ─────────────────────────────────
    subscriptions_to_notify = set()

    # 1. Staff avec StaffProfile actif
    active_profiles = StaffProfile.objects.filter(is_active=True).select_related('user')
    for profile in active_profiles:
        notify_universes = profile.notify_universes or []
        # Si le profil a des filtres d'univers ET qu'un univers est précisé,
        # vérifier que l'univers correspond
        if universe and notify_universes and universe not in notify_universes:
            continue
        subs = PushSubscription.objects.filter(user=profile.user)
        for sub in subs:
            subscriptions_to_notify.add(sub.id)

    # 2. Superusers sans StaffProfile (le vrai admin)
    staff_user_ids = active_profiles.values_list('user_id', flat=True)
    superusers = User.objects.filter(is_superuser=True).exclude(id__in=staff_user_ids)
    for su in superusers:
        subs = PushSubscription.objects.filter(user=su)
        for sub in subs:
            subscriptions_to_notify.add(sub.id)

    # ── Envoyer ───────────────────────────────────────────────────────────────
    errors = []
    to_delete = []

    for sub in PushSubscription.objects.filter(id__in=subscriptions_to_notify):
        try:
            webpush(
                subscription_info={
                    'endpoint': sub.endpoint,
                    'keys': {
                        'p256dh': sub.p256dh,
                        'auth':   sub.auth_key,
                    },
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims=settings.VAPID_CLAIMS,
            )
        except Exception as e:
            err_str = str(e)
            logger.warning(f'push_utils: WebPush error for sub {sub.id} — {err_str}')
            errors.append(err_str)
            # Souscription expirée / invalide → supprimer
            if '410' in err_str or '404' in err_str:
                to_delete.append(sub.id)

    if to_delete:
        PushSubscription.objects.filter(id__in=to_delete).delete()

    return errors
