# EthniSpirit — Guide de déploiement LWS cPanel L

**Domaine :** `ethnispirit.com` (registrar Wix, A record → LWS)
**Hébergement :** LWS cPanel L
**Architecture :** Frontend React → `ethnispirit.com` | API Django → `backend.ethnispirit.com`

---

## Prérequis vérifiés

- [x] Domaine `ethnispirit.com` — A record sur Wix pointant sur `91.234.194.198`
- [x] Sous-domaine `backend.ethnispirit.com` — créé sur Wix (A record `91.234.194.198`) ET dans cPanel > Sous-domaines
- [ ] Base de données PostgreSQL créée sur LWS
- [ ] Compte email `contact@ethnispirit.com` créé sur LWS

---

## PARTIE 1 — Préparation locale (sur votre machine)

### 1.1 Build du frontend

```bash
cd frontend
npm run build
```

Le dossier `dist/` est généré. Il contient déjà un fichier `.htaccess` (copié depuis `public/.htaccess`) qui gère le routing React.

### 1.2 Vérification

```bash
ls dist/
# Doit contenir : index.html, assets/, .htaccess
```

---

## PARTIE 2 — Configuration LWS cPanel

### 2.1 Créer la base de données PostgreSQL

Dans cPanel > **Bases de données PostgreSQL** :

1. Créer une base : `VOTRE_LOGIN_ethnispirit`
2. Créer un utilisateur : `VOTRE_LOGIN_ethniuser` + mot de passe fort
3. Associer l'utilisateur à la base (tous les privilèges)

Noter les identifiants — ils iront dans le `.env` du serveur.

### 2.2 Créer le sous-domaine dans cPanel

Dans cPanel > **Sous-domaines** :

- Sous-domaine : `backend`
- Domaine : `ethnispirit.com`
- Répertoire racine : `public_html/backend` (laisser la valeur proposée par cPanel)

### 2.3 Activer Python via "Setup Python App"

Dans cPanel > **Software > Setup Python App** :

| Champ | Valeur |
|-------|--------|
| Python version | 3.10 (ou plus récente disponible) |
| Application root | `ethnispirit/backend` |
| Application URL | `backend.ethnispirit.com` |
| Application startup file | `passenger_wsgi.py` |
| Application Entry point | `application` |
| Passenger log file | `logs/passenger.log` (optionnel) |

Cliquer **Create** — LWS crée le virtualenv automatiquement.

### 2.4 Installer les dépendances Python

Après la création via "Setup Python App", cliquer sur **Enter to the virtual environment** pour obtenir la commande d'activation, ou utiliser le **Terminal cPanel** :

```bash
source /home/VOTRE_LOGIN/virtualenvs/ethnispirit/bin/activate
pip install -r /home/VOTRE_LOGIN/ethnispirit/backend/requirements.txt
```

---

## PARTIE 3 — Upload des fichiers

### 3.1 Structure de fichiers sur le serveur

```
/home/VOTRE_LOGIN/
├── public_html/
│   ├── index.html          ← React build
│   ├── assets/             ← JS/CSS/images build
│   ├── .htaccess           ← React Router (depuis dist/)
│   └── backend/
│       ├── passenger_wsgi.py   ← point d'entrée Passenger
│       └── .htaccess           ← activation Passenger (voir 3.3)
│
└── ethnispirit/
    └── backend/            ← projet Django
        ├── manage.py
        ├── .env            ← variables production (voir 3.2)
        ├── passenger_wsgi.py
        ├── requirements.txt
        ├── backend/
        │   ├── settings/
        │   │   ├── base.py
        │   │   ├── production.py
        │   │   └── development.py
        │   ├── urls.py
        │   └── wsgi.py
        ├── api/
        ├── userauths/
        ├── media/          ← uploads (images produits, etc.)
        └── staticfiles/    ← généré par collectstatic
```

### 3.2 Upload du frontend

Via **cPanel > Gestionnaire de fichiers** ou FTP (FileZilla) :

- Uploader le **contenu** du dossier `dist/` dans `public_html/` (pas le dossier lui-même)
- S'assurer que `.htaccess` est bien présent dans `public_html/`

### 3.3 Upload du backend

Via FTP, uploader le dossier `backend/` (le dossier Django) dans :
```
/home/VOTRE_LOGIN/ethnispirit/backend/
```

### 3.4 Configurer le fichier `.env` de production

1. Copier `backend/.env.production` (le template fourni)
2. Remplir toutes les valeurs (DB, email, etc.)
3. Renommer en `.env`
4. Uploader dans `/home/VOTRE_LOGIN/ethnispirit/backend/.env`

### 3.5 Configurer `passenger_wsgi.py`

Dans le fichier `backend/passenger_wsgi.py`, modifier la ligne :
```python
PROJECT_ROOT = '/home/VOTRE_LOGIN/ethnispirit/backend'
```
Remplacer `VOTRE_LOGIN` par votre vrai login LWS.

Uploader ce fichier en **deux endroits** :
1. `/home/VOTRE_LOGIN/ethnispirit/backend/passenger_wsgi.py` (dans le projet)
2. `/home/VOTRE_LOGIN/public_html/backend/passenger_wsgi.py` (document root du sous-domaine)

### 3.6 Créer le `.htaccess` du sous-domaine backend

Créer le fichier `/home/VOTRE_LOGIN/public_html/backend/.htaccess` avec ce contenu :

```apache
PassengerEnabled on
PassengerBaseURI /
PassengerAppRoot /home/VOTRE_LOGIN/ethnispirit/backend
PassengerPython /home/VOTRE_LOGIN/virtualenvs/ethnispirit/bin/python3

<Directory /home/VOTRE_LOGIN/public_html/backend>
    Allow from all
</Directory>
```

> Remplacer `VOTRE_LOGIN` par votre vrai login LWS dans les 3 endroits.

---

## PARTIE 4 — Initialisation Django sur le serveur

Via **Terminal cPanel** (cPanel > Advanced > Terminal) :

```bash
# Activer le virtualenv
source /home/VOTRE_LOGIN/virtualenvs/ethnispirit/bin/activate

# Se placer dans le projet
cd /home/VOTRE_LOGIN/ethnispirit/backend

# Appliquer les migrations
python manage.py migrate

# Collecter les fichiers statiques (admin Django, etc.)
python manage.py collectstatic --noinput

# Créer le compte administrateur
python manage.py createsuperuser
```

---

## PARTIE 5 — SSL (HTTPS)

### 5.1 SSL pour `ethnispirit.com`

Dans cPanel > **SSL/TLS > AutoSSL** :
- Vérifier que `ethnispirit.com` et `www.ethnispirit.com` sont dans la liste
- Cliquer **Run AutoSSL** si le certificat n'est pas encore installé

### 5.2 SSL pour `backend.ethnispirit.com`

Même section : vérifier que `backend.ethnispirit.com` apparaît et a un certificat valide.

> AutoSSL utilise la validation HTTP (Let's Encrypt). Il faut que les domaines résolvent correctement vers le serveur LWS avant de lancer AutoSSL.

---

## PARTIE 6 — Tâches CRON

Dans cPanel > **Cron Jobs**, ajouter ces 3 tâches :

| Fréquence | Commande |
|-----------|----------|
| Toutes les heures (0 * * * *) | `source /home/VOTRE_LOGIN/virtualenvs/ethnispirit/bin/activate && python /home/VOTRE_LOGIN/ethnispirit/backend/manage.py send_abandoned_cart_emails` |
| Toutes les heures (30 * * * *) | `source /home/VOTRE_LOGIN/virtualenvs/ethnispirit/bin/activate && python /home/VOTRE_LOGIN/ethnispirit/backend/manage.py send_restock_notifications` |
| Une fois par jour (0 8 * * *) | `source /home/VOTRE_LOGIN/virtualenvs/ethnispirit/bin/activate && python /home/VOTRE_LOGIN/ethnispirit/backend/manage.py send_review_requests` |

---

## PARTIE 7 — Vérification finale

### Checklist

- [ ] `https://ethnispirit.com` charge la page d'accueil React
- [ ] `https://backend.ethnispirit.com/api/products/` retourne du JSON
- [ ] `https://backend.ethnispirit.com/admin/` charge le panneau Django
- [ ] Connexion / inscription sur le site fonctionne
- [ ] Ajout au panier fonctionne
- [ ] Images produits s'affichent (test avec `/media/...`)
- [ ] Certificats SSL valides sur les deux domaines (cadenas vert)
- [ ] Rechargement de page (`F5`) sur `/catalogue` fonctionne (React Router)

### Test de l'API depuis le navigateur

```
https://backend.ethnispirit.com/api/products/?universe=mode
https://backend.ethnispirit.com/api/categories/?universe=mode
```

Ces URLs doivent retourner du JSON.

---

## Stripe — passage en mode live

Quand le compte Stripe est validé pour les paiements réels :

1. Dans le tableau de bord Stripe, récupérer les clés `live` (commençant par `pk_live_` et `sk_live_`)
2. Mettre à jour `.env` sur le serveur :
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
3. Mettre à jour `frontend/.env.production` :
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
4. Rebuilder le frontend (`npm run build`) et re-uploader `dist/`
5. Configurer le webhook Stripe pour pointer vers `https://backend.ethnispirit.com/api/stripe/webhook/`

---

## Débogage courant

| Symptôme | Solution probable |
|----------|-------------------|
| Page blanche sur `ethnispirit.com` | Vérifier que `index.html` est bien dans `public_html/` |
| Rechargement sur `/catalogue` → 404 | Vérifier que `.htaccess` est dans `public_html/` |
| API retourne 500 | Consulter `logs/passenger.log` via cPanel, ou `python manage.py check --deploy` |
| Images produits ne s'affichent pas | Vérifier que `media/` est uploadé et que `MEDIA_ROOT` est correct |
| Erreur CORS | Vérifier `CORS_ALLOWED_ORIGINS` dans `production.py` |
| Email non reçu | Vérifier les identifiants SMTP dans `.env` et que le port 465 est autorisé |

---

*EthniSpirit V1 — Mai 2026*
