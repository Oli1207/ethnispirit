"""
Point d'entrée Phusion Passenger — backend.ethnispirit.com
===========================================================
Ce fichier doit se trouver dans le dossier racine du sous-domaine
(le même dossier que manage.py).

Le chemin est déterminé dynamiquement via __file__ — aucune
modification manuelle nécessaire quel que soit le serveur.
"""

import sys
import os
from pathlib import Path

# Dossier contenant manage.py (= dossier de ce fichier)
PROJECT_ROOT = str(Path(__file__).resolve().parent)

sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
