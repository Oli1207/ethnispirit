from .base import *

DEBUG = False

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[
    'ethnispirit.com',
    'www.ethnispirit.com',
    'backend.ethnispirit.com',
])

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'https://ethnispirit.com',
    'https://www.ethnispirit.com',
])

CORS_ALLOW_CREDENTIALS = True

# ── Email — valeurs lues depuis .env (EMAIL_HOST, EMAIL_PORT, EMAIL_USE_SSL…) ──
# Les variables EMAIL_* sont toutes configurables via le fichier .env du serveur.
# Voir .env.example pour les valeurs recommandées.

# ── Sécurité HTTP ─────────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER    = True
SECURE_CONTENT_TYPE_NOSNIFF  = True
X_FRAME_OPTIONS              = 'DENY'

# HSTS — indique aux navigateurs de toujours utiliser HTTPS (1 an)
SECURE_HSTS_SECONDS           = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD           = True

# Redirige HTTP → HTTPS automatiquement (géré par Django avant Passenger)
SECURE_SSL_REDIRECT           = True

# Cookies de session et CSRF uniquement sur HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE    = True

# ── Fichiers statiques (pas de dossier static/ local sur le serveur) ──────────
STATICFILES_DIRS = []

# ── Email destinataire des messages de contact ────────────────────────────────
CONTACT_RECIPIENT = 'support@ethnispirit.com'
