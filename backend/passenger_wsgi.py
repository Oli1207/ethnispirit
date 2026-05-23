"""
Point d'entrée Phusion Passenger — backend.ethnispirit.com
===========================================================
- Chemin dynamique via __file__ (pas de login hardcodé)
- try/except qui renvoie le traceback brut en cas de crash Django
  (utile pour diagnostiquer les erreurs de démarrage)
"""

import os
import sys
import traceback
from pathlib import Path

# Dossier contenant manage.py (= dossier de ce fichier)
PROJECT_ROOT = str(Path(__file__).resolve().parent)
sys.path.insert(0, PROJECT_ROOT)

os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings.production'

try:
    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
except Exception:
    error_msg = traceback.format_exc().encode('utf-8')

    def application(environ, start_response):
        start_response('500 Internal Server Error', [
            ('Content-Type', 'text/plain; charset=utf-8'),
            ('Content-Length', str(len(error_msg))),
            ('Access-Control-Allow-Origin', '*'),
        ])
        return [error_msg]
