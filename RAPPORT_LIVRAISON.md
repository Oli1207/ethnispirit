# EthniSpirit — Rapport de livraison technique
### Plateforme e-commerce · Mai 2026

---

## Vue d'ensemble

Ce document présente l'ensemble des fonctionnalités développées pour la plateforme **EthniSpirit**. Chaque section décrit ce qui a été construit, comment cela fonctionne, et quel bénéfice concret cela apporte à la boutique et à ses clientes.

---

## 1. Double univers — Mode Antillaise & Bio & Naturel

**Ce qui a été fait :** Le site est structuré en deux univers distincts avec chacun sa propre identité visuelle, sa palette de couleurs, sa navigation et son catalogue.

- **Mode Antillaise** (`/`, `/catalogue`) — tons terracotta, fil rouge dans toute l'interface
- **Bio & Naturel** (`/bio`, `/bio/catalogue`) — tons verts, ambiance naturelle et apaisante

Les deux univers partagent le même moteur (panier, compte client, checkout, commandes) mais s'affichent de façon totalement indépendante.

**Impact boutique :** Une cliente qui vient chercher une robe madras et une cliente qui cherche une huile de soin vivent une expérience cohérente avec ce qu'elles attendent — sans se mélanger.

---

## 2. Modal de bienvenue avec code promo

**Ce qui a été fait :** À la première visite, un modal de bienvenue s'affiche avec un code promo exclusif. Le modal est configurable directement depuis le tableau de bord admin :

- Titre, message, code et valeur personnalisables
- **Univers cible** : le modal peut être réservé à la boutique Mode, à la boutique Bio, ou affiché sur les deux
- Le bouton **"Profiter de l'offre"** enregistre automatiquement le code dans le navigateur de la cliente et la redirige vers le catalogue — le code est déjà actif au moment de passer commande, sans aucune saisie manuelle
- Le modal ne s'affiche qu'une seule fois par navigateur

**Impact boutique :** Taux de conversion amélioré sur les premières visites. Le code s'applique sans friction.

---

## 3. Système de codes promo multi-univers

**Ce qui a été fait :** Un système de codes promo complet avec des règles de cumul intelligentes.

**Création des codes (admin) :**
- Pourcentage ou montant fixe
- Date de début / fin de validité
- Limite d'utilisation totale
- **Univers** : un code peut s'appliquer uniquement aux produits Mode, uniquement aux produits Bio, ou à tout le panier (`all`)

**Règles de cumul :**
- Maximum 2 codes actifs en même temps, à condition qu'ils ciblent des univers différents (un Mode + un Bio)
- Un code `all` bloque tout ajout supplémentaire
- Ces règles sont vérifiées côté serveur — elles ne peuvent pas être contournées

**Affichage transparent :** Dans le panier et au checkout, chaque code appliqué s'affiche avec sa remise exacte et un badge coloré indiquant l'univers concerné.

**Impact boutique :** Possibilité de faire des promotions ciblées par collection sans risque d'abus ou de cumul non souhaité.

---

## 4. Filtres et tri du catalogue

**Ce qui a été fait :** Une barre de filtres est disponible sur les pages catalogue (Mode et Bio) :

- **Tri** : pertinence, prix croissant/décroissant, nouveautés
- **En stock uniquement** : masque les articles en rupture
- **Filtre par certification/label** : les labels présents dans le catalogue (Bio, Artisanal, Fait main, etc.) apparaissent comme chips sélectionnables
- Bouton de réinitialisation des filtres

Le filtrage se fait côté client, instantanément, sans rechargement de page.

**Impact boutique :** Les clientes trouvent ce qu'elles cherchent plus vite. Le filtre "En stock" évite la frustration de cliquer sur un article indisponible.

---

## 5. Produits similaires — "Vous aimerez aussi"

**Ce qui a été fait :** Sur chaque fiche produit, une section "Vous aimerez aussi" affiche jusqu'à 4 produits de la même catégorie, en excluant le produit en cours. Les produits suggérés sont actifs et en stock.

**Impact boutique :** Augmente le panier moyen et le temps passé sur le site.

---

## 6. Prévenez-moi — Alerte retour en stock

**Ce qui a été fait :** Quand un produit est en rupture de stock, un bouton "Prévenez-moi dès le retour" s'affiche sur la fiche produit. La cliente peut laisser son **email** et optionnellement son **numéro de téléphone**.

- Une seule inscription possible par email par produit (pas de doublons)
- Dès que le stock est réapprovisionné, un email de notification est envoyé automatiquement à toutes les personnes inscrites
- L'admin peut voir la liste complète des demandes dans le panneau Alertes stock (voir point 7)

**Impact boutique :** Aucune vente perdue sur rupture. Les clientes intéressées reviennent d'elles-mêmes.

---

## 7. Alertes de stock bas — Interface admin

**Ce qui a été fait :** Un panneau dédié dans la page Gestion des produits permet de configurer les alertes stock :

- **Seuil** : choisir à partir de quel niveau de stock un email d'alerte est déclenché (ex. : alerte quand stock < 5)
- **Email de notification** : l'adresse qui reçoit les alertes
- **Activation / désactivation** des alertes en un clic

Le même panneau affiche deux listes :
- **En attente d'envoi** : les clients qui ont demandé à être prévenus et dont le produit est de nouveau disponible
- **Déjà notifiés** : l'historique des notifications envoyées

**Impact boutique :** L'admin est alertée avant d'atteindre la rupture complète, et peut voir en un coup d'œil quels clients attendent un réapprovisionnement.

---

## 8. Email de confirmation de commande

**Ce qui a été fait :** Dès qu'un paiement est confirmé, la cliente reçoit automatiquement un email de confirmation contenant :

- Récapitulatif complet des articles achetés avec quantités et prix
- Montant total de la commande
- **Lien de suivi de commande** direct : la cliente peut consulter l'état de sa commande à tout moment sans créer de compte

**Impact boutique :** Rassure la cliente immédiatement après l'achat et réduit les contacts support "où est ma commande ?".

---

## 9. Page de suivi de commande

**Ce qui a été fait :** Une page publique `/suivi-commande` permet à n'importe quelle cliente (connectée ou non) de retrouver sa commande en saisissant :

- Sa **référence de commande** (format `ES-AAAAMMJJ-XXXX`, reçue par email)
- Son **adresse e-mail**

La page affiche le statut en temps réel (En attente → Payée → En traitement → Expédiée → Livrée), la date, la liste des articles et le total.

**Impact boutique :** Autonomie totale pour la cliente. Zéro email de support pour des questions de suivi basiques.

---

## 10. Email de relance — Panier abandonné

**Ce qui a été fait :** Quand une cliente commence à remplir le formulaire de commande (en saisissant son email) sans finaliser son achat, le système l'identifie et lui envoie automatiquement un email de relance après **2 heures**.

L'email contient la liste des articles laissés dans le panier et un lien direct pour revenir le finaliser.

Le système est intelligent : pas d'envoi si la cliente a passé une commande dans les 24 dernières heures, pas d'envoi si le panier est vide.

**Impact boutique :** Récupération automatique des paniers abandonnés — une source de revenus directe sans aucune intervention manuelle.

---

## 11. Email d'avis post-achat

**Ce qui a été fait :** 7 jours après qu'une commande passe au statut "Livrée", la cliente reçoit automatiquement un email lui demandant de laisser un avis sur les produits qu'elle a achetés. L'email contient un lien direct vers chaque fiche produit.

L'email n'est envoyé qu'une seule fois par commande.

**Impact boutique :** Les avis clients se collectent automatiquement et renforcent la preuve sociale sur les fiches produit.

---

## 12. Preuve sociale — Ventes et notes

**Ce qui a été fait :** Sur chaque fiche produit :

- **Note moyenne** calculée à partir des avis clients, affichée sous forme d'étoiles avec le nombre d'avis
- **Compteur de ventes** : "X personnes ont déjà acheté cet article"

Ces indicateurs se mettent à jour automatiquement à chaque nouvelle commande et à chaque nouvel avis.

**Impact boutique :** Réduit l'hésitation à l'achat. Un article avec 47 ventes et 4,8 étoiles se vend mieux qu'un article sans indication.

---

## 13. Export des commandes en CSV

**Ce qui a été fait :** Dans le tableau de bord admin, un bouton **"Exporter CSV"** génère et télécharge immédiatement un fichier contenant toutes les commandes avec leurs détails (référence, date, statut, client, montant, articles, adresse de livraison).

**Impact boutique :** Compatible avec Excel, Google Sheets et tous les outils comptables. Idéal pour la gestion mensuelle ou pour un prestataire comptable.

---

## 14. PWA — Application installable

**Ce qui a été fait :** Le site est une **Progressive Web App** : sur mobile, les clientes peuvent l'installer sur leur écran d'accueil comme une vraie application, sans passer par l'App Store.

- Icône personnalisée EthniSpirit sur l'écran d'accueil
- Chargement instantané même avec une connexion lente
- Expérience plein écran sans barre de navigation du navigateur

**Impact boutique :** Engagement accru. Une cliente qui installe l'app revient plus souvent qu'une cliente qui passe uniquement par le navigateur.

---

## 15. Tableau de bord administrateur complet

**Ce qui a été fait :** Un espace admin accessible uniquement aux administrateurs, avec 9 sections :

| Section | Contenu |
|---------|---------|
| **Dashboard** | Statistiques temps réel : CA du jour/mois, nombre de commandes, produits actifs |
| **Commandes** | Liste complète, filtre par statut, mise à jour du statut, export CSV |
| **Produits** | Création/modification/suppression, gestion des images, alertes stock |
| **Catégories** | Création/modification/suppression par univers (Mode ou Bio) |
| **Livraison** | Configuration des tarifs par destination |
| **Codes promo** | Création/modification/suppression, gestion par univers |
| **Newsletter** | Liste des abonnées, export CSV |
| **Contacts** | Messages reçus via le formulaire de contact |
| **Analytics** | Suivi des pages vues et des événements clés |

---

## Résumé des fonctionnalités

| # | Fonctionnalité | Type | Statut |
|---|---------------|------|--------|
| 1 | Double univers Mode & Bio | Architecture | Livré |
| 2 | Modal de bienvenue + code promo auto | Conversion | Livré |
| 3 | Codes promo multi-univers avec règles de cumul | Marketing | Livré |
| 4 | Filtres et tri du catalogue | UX | Livré |
| 5 | Produits similaires | Conversion | Livré |
| 6 | Alerte retour en stock (Prévenez-moi) | Rétention | Livré |
| 7 | Alertes stock bas — interface admin | Gestion | Livré |
| 8 | Email de confirmation de commande | Post-achat | Livré |
| 9 | Page de suivi de commande | Support | Livré |
| 10 | Email de relance panier abandonné | Récupération | Livré |
| 11 | Email d'avis post-achat | Réputation | Livré |
| 12 | Preuve sociale (ventes + notes) | Conversion | Livré |
| 13 | Export commandes CSV | Gestion | Livré |
| 14 | PWA — Application installable | Engagement | Livré |
| 15 | Tableau de bord admin (9 sections) | Gestion | Livré |

---

## Note de déploiement

Avant la mise en ligne, exécuter les migrations de base de données :

```bash
python manage.py migrate
```

Puis configurer les **3 tâches cron** sur le cPanel LWS (une fois par heure) :

```bash
# Relance paniers abandonnés (toutes les heures)
python /home/user/ethnispirit/backend/manage.py send_abandoned_cart_emails

# Notifications retour en stock (toutes les heures)
python /home/user/ethnispirit/backend/manage.py send_restock_notifications

# Emails d'avis post-achat (une fois par jour)
python /home/user/ethnispirit/backend/manage.py send_review_requests
```

Configurer également les variables d'environnement SMTP dans le fichier `.env` :

```
EMAIL_HOST=mail.ethnispirit.com
EMAIL_PORT=465
EMAIL_HOST_USER=support@ethnispirit.com
EMAIL_HOST_PASSWORD=***
EMAIL_USE_SSL=True
DEFAULT_FROM_EMAIL=EthniSpirit <support@ethnispirit.com>
CONTACT_RECIPIENT=support@ethnispirit.com
FRONTEND_URL=https://ethnispirit.com
```

---

*Document généré le 15 mai 2026 — EthniSpirit V1*
