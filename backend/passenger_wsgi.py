"""
Point d'entrée Phusion Passenger — backend.ethnispirit.com
===========================================================
Ce fichier doit se trouver dans le dossier racine du sous-domaine
tel que configuré dans cPanel > Sous-domaines.

Chemin typique sur LWS :
  /home/VOTRE_LOGIN/public_html/backend/passenger_wsgi.py

MODIFIER la variable PROJECT_ROOT ci-dessous avec le chemin
absolu vers le dossier backend/ de l'application Django.
"""

import sys
import os

# ============================================================
# MODIFIER ICI — chemin absolu vers le dossier backend/
# (celui qui contient manage.py)
# Exemple : /home/monlogin/ethnispirit/backend
# ============================================================
PROJECT_ROOT = '/home/VOTRE_LOGIN/ethnispirit/backend'
# ============================================================

sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
