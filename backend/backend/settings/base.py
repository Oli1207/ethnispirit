"""
Django settings — BASE (partagé par tous les environnements)
"""

from pathlib import Path
from datetime import timedelta
import os
from environs import Env

env = Env()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env.read_env(os.path.join(BASE_DIR, '.env'))

# ── Sécurité ──────────────────────────────────────────────────────────────────
SECRET_KEY = env.str('SECRET_KEY')

# ── Applications ──────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'userauths',
    'api',
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ── Base de données ───────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     env.str('DB_NAME'),
        'USER':     env.str('DB_USER'),
        'PASSWORD': env.str('DB_PASSWORD'),
        'HOST':     env.str('DB_HOST', default='localhost'),
        'PORT':     env.str('DB_PORT', default='5432'),
    }
}

# ── Authentification ──────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'userauths.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    # ── Rate limiting (anti brute-force) ──────────────────────────────────────
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "300/hour",       # visiteurs anonymes — global
        "user": "2000/hour",      # utilisateurs connectés — global
        "login": "10/minute",     # endpoint /auth/token/  (brute force)
        "password_reset": "5/minute",  # /auth/forgot-password/
        "promo": "30/minute",     # /promo/check/  (devinette de codes)
    },
}

# ── Simple JWT ────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=200),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
}

# ── Internationalisation ──────────────────────────────────────────────────────
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE     = 'America/Martinique'
USE_I18N      = True
USE_TZ        = True

# ── Fichiers statiques & médias ───────────────────────────────────────────────
STATIC_URL       = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT      = BASE_DIR / 'staticfiles'

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ── GeoIP2 (analytics géographiques) ─────────────────────────────────────────
GEOIP2_DB_PATH = BASE_DIR / 'GeoLite2-City.mmdb'



EMAIL_BACKEND      = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST         = 'mail.ethnispirit.com'
EMAIL_PORT         = 465
#EMAIL_USE_SSL      = True
EMAIL_USE_TLS      = True
EMAIL_HOST_USER    = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'support@ethnispirit.com'
EMAIL_TIMEOUT      = 10
EMAIL_USE_LOCALTIME = True

# ── Stripe ────────────────────────────────────────────────────────────────────
# Ces clés DOIVENT être définies dans le fichier .env (jamais en dur ici)
STRIPE_SECRET_KEY      = env.str('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = env.str('STRIPE_PUBLISHABLE_KEY')

# ── Frontend URL ──────────────────────────────────────────────────────────────
FRONTEND_URL = env.str('FRONTEND_URL', default='http://localhost:5173')

# ── Clé primaire par défaut ───────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
