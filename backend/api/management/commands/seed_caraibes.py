"""
Commande Django : seed_caraibes
================================
Cree 10 produits bijoux + 10 produits sacs a partir des photos client,
copie les images vers media/products/ et deplace les sources vers
un dossier "images_utilisees" pour eviter les doublons.

Usage :
    # Chemins par defaut (Windows local)
    python manage.py seed_caraibes

    # Chemins custom (serveur Linux)
    python manage.py seed_caraibes \
        --bijoux-dir /home/c2801801c/images/bijoux_caraibes \
        --sacs-dir   /home/c2801801c/images/sac_caraibes \
        --used-dir   /home/c2801801c/images/images_utilisees

    # Apercu sans rien creer
    python manage.py seed_caraibes --dry-run
"""

import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings

# Chemins par defaut (machine de developpement Windows)
_DEFAULT_BIJOUX = r"C:\Users\LENOVO\Documents\bijoux_caraibes"
_DEFAULT_SACS   = r"C:\Users\LENOVO\Documents\sac_caraibes"
_DEFAULT_USED   = r"C:\Users\LENOVO\Documents\images_utilisees"


# ── Données produits ───────────────────────────────────────────────────────────
# Chaque dict : name, slug_hint, description, origin, price, old_price,
#               stock, is_featured, certification, subcategory, image_file

BIJOUX_PRODUCTS = [
    {
        "name": "Collier Pendentif Afrique Multicolore",
        "description": (
            "Collier à chaîne dorée ornée d'un large pendentif en forme de carte d'Afrique "
            "serti de pierres multicolores : rubis, émeraude, saphir, améthyste et zircon. "
            "Une pièce statement qui célèbre la richesse du continent africain. "
            "Chaîne ajustable, métal plaqué or."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "55.00",
        "old_price": None,
        "stock": 5,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Colliers",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.05.jpeg",
    },
    {
        "name": "Boucles d'Oreilles Carte Afrique Dorées",
        "description": (
            "Boucles d'oreilles clous représentant la silhouette dorée de la carte d'Afrique. "
            "Légères et délicates, elles s'accordent à toutes les tenues du quotidien. "
            "Tige en acier inoxydable doré, poids plume."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "15.00",
        "old_price": None,
        "stock": 12,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Boucles d'oreilles",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.05 (1).jpeg",
    },
    {
        "name": "Ceinture Cauri Artisanale sur Cuir",
        "description": (
            "Ceinture artisanale composée de cauris naturels soigneusement cousus en rang "
            "serré sur une lanière de cuir véritable tressée. Le cauri est symbole de "
            "prospérité et de fertilité dans de nombreuses cultures africaines. "
            "Fermeture par lacet de cuir, taille unique ajustable."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "45.00",
        "old_price": None,
        "stock": 4,
        "is_featured": False,
        "certification": "Artisanal, Naturel",
        "subcategory": "Ceintures",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.06.jpeg",
    },
    {
        "name": "Collier Pendentif Feuille Tropicale Dorée",
        "description": (
            "Collier long satoir à chaîne dorée avec un grand pendentif feuille tropicale "
            "pavé de zirconiums blancs et d'émeraudes synthétiques. Inspiré de la végétation "
            "luxuriante des Antilles et de l'Afrique équatoriale. "
            "Longueur chaîne : 70 cm, pendentif : 6 cm."
        ),
        "origin": "Caraïbes",
        "price": "55.00",
        "old_price": None,
        "stock": 4,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Colliers",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.06 (1).jpeg",
    },
    {
        "name": "Bracelet Doré Motifs Africains",
        "description": (
            "Collection de bracelets en métal plaqué or ornés de motifs africains : "
            "carte du continent, cauri, croix Ankh, symboles géométriques. "
            "Disponibles en jonc fin, manchette large ou bracelet ouvert. "
            "Vendus à l'unité — indiquez votre modèle préféré en commentaire."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "30.00",
        "old_price": None,
        "stock": 10,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Bracelets & Parures",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.06 (2).jpeg",
    },
    {
        "name": "Parure Cauri Dorée — Collier, Boucles & Bracelet",
        "description": (
            "Parure complète 3 pièces en métal plaqué or : collier à pendentif cauri, "
            "boucles d'oreilles cauri assortis et bracelet manchette. "
            "Le cauri, symbole ancestral de richesse, est ici sublimé dans un écrin doré. "
            "Idéale en cadeau, présentée dans une pochette velours."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "70.00",
        "old_price": "85.00",
        "stock": 3,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Bracelets & Parures",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.06 (3).jpeg",
    },
    {
        "name": "Collier Pendentif Masque Africain Strass",
        "description": (
            "Collier satoir à longue chaîne dorée ornée d'un pendentif représentant un masque "
            "africain stylisé aux traits fins, entouré de rangées de diamants synthétiques. "
            "Pièce statement très remarquée, parfaite pour les soirées et événements culturels. "
            "Chaîne longueur : 75 cm."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "55.00",
        "old_price": None,
        "stock": 4,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Colliers",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.06 (4).jpeg",
    },
    {
        "name": "Bague Motifs Africains Dorée",
        "description": (
            "Collection de bagues en métal plaqué or aux motifs africains variés : "
            "croix Ankh (symbole de vie égyptien), cauri, cœur, géométrique et zébrée. "
            "Tailles disponibles du 50 au 60. "
            "Précisez la taille et le motif souhaités en commentaire de commande."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "35.00",
        "old_price": None,
        "stock": 15,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Boucles d'oreilles",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.07.jpeg",
    },
    {
        "name": "Collier Pendentif Ankh Touareg Émaillé",
        "description": (
            "Collier à chaîne dorée avec un grand pendentif architectural inspiré de la croix "
            "Ankh touarègue, entièrement pavé de micro-billes turquoise et de pierres colorées. "
            "Un bijou au fort pouvoir symbolique alliant esthétique berbère et savoir-faire artisanal. "
            "Chaîne ajustable : 60–70 cm."
        ),
        "origin": "Afrique du Nord",
        "price": "55.00",
        "old_price": None,
        "stock": 3,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Colliers",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.07 (1).jpeg",
    },
    {
        "name": "Parure Géométrique Tigre — Jonc, Manchette & Bague",
        "description": (
            "Parure 3 pièces en acier inoxydable doré et résine motif tigre : "
            "jonc fin, manchette large et bague ouverte assortie. "
            "Le motif animalier apporte une touche sauvage et tendance à ce set collector. "
            "Présentée dans sa boîte cadeau, idéale pour offrir."
        ),
        "origin": "Caraïbes",
        "price": "70.00",
        "old_price": None,
        "stock": 2,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Bracelets & Parures",
        "image_file": "WhatsApp Image 2026-05-23 at 21.21.07 (2).jpeg",
    },
]

SACS_PRODUCTS = [
    {
        "name": "Pochette Jute Côte d'Ivoire Cacao",
        "description": (
            "Pochette zippée en toile de jute recyclée estampillée « Produce of Côte d'Ivoire Cocoa ». "
            "Un accessoire éco-responsable et engagé qui valorise le patrimoine agricole ivoirien. "
            "Doublure noire, fermeture éclair, format A5. "
            "Parfaite comme trousse de toilette, pochette de soirée ou cadeau original."
        ),
        "origin": "Côte d'Ivoire",
        "price": "30.00",
        "old_price": None,
        "stock": 6,
        "is_featured": False,
        "certification": "Artisanal, Naturel",
        "subcategory": "Pochettes",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.42.jpeg",
    },
    {
        "name": "Grand Tote Bag Wax Kente Rayé",
        "description": (
            "Grand sac cabas en tissu wax à rayures kente multicolores (gris, rouge, noir, orange). "
            "Anses courtes en tissu renforcé, coupe ample et profonde, idéal pour les courses "
            "ou la plage. Doublure intérieure, contenance 20 L environ."
        ),
        "origin": "Ghana",
        "price": "45.00",
        "old_price": None,
        "stock": 5,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Tote Bags",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.42 (1).jpeg",
    },
    {
        "name": "Sac à Main Wax Bogolan Noir & Blanc",
        "description": (
            "Sac à main structuré en wax bogolan noir et blanc à motifs géométriques, "
            "anses courtes en cuir synthétique noir et fermoir doré. "
            "Design audacieux inspiré du tissu bogolan malien, symbole de résistance. "
            "Dimensions : 35 × 28 × 10 cm, avec poche intérieure zippée."
        ),
        "origin": "Mali",
        "price": "55.00",
        "old_price": None,
        "stock": 4,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Sacs à main",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.43.jpeg",
    },
    {
        "name": "Sac Bandoulière Wax à Volants Multicolore",
        "description": (
            "Sac bandoulière festif en wax multicolore (jaune, bleu, rouge, vert) agrémenté "
            "de volants superposés en cascade et d'une chaîne argentée amovible. "
            "Fermeture éclair, doublure satinée, poche avant. "
            "Idéal pour une soirée caribéenne ou un événement afro-culturel."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "45.00",
        "old_price": None,
        "stock": 3,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Sacs bandoulière",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.43 (1).jpeg",
    },
    {
        "name": "Sac Bandoulière Cuir Motif Bogolan",
        "description": (
            "Sac bandoulière en cuir véritable vieilli avec incrustation de tissu bogolan "
            "aux motifs abstraits bruns et ocres. Fermeture en rabat, sangle réglable 60–120 cm. "
            "Pièce unique alliant cuir naturel et textile traditionnel malien, "
            "fabriquée à la main par des artisans locaux."
        ),
        "origin": "Mali",
        "price": "53.00",
        "old_price": None,
        "stock": 2,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Sacs bandoulière",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.44.jpeg",
    },
    {
        "name": "Grand Sac Wax Patchwork à Franges",
        "description": (
            "Grand sac cabas en wax patchwork multicolore avec des dizaines de bandelettes "
            "de tissu wax différents cousues en franges superposées. "
            "Spectaculaire et unique, aucun sac identique. "
            "Anses cuir renforcées, contenance XXL, parfait pour le marché ou la plage."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "80.00",
        "old_price": None,
        "stock": 2,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Tote Bags",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.44 (1).jpeg",
    },
    {
        "name": "Pochette Wax Kente Géométrique",
        "description": (
            "Pochette compacte en wax kente à motifs géométriques (kaki, orange vif, noir). "
            "Fermeture par rabat, bandoulière fine amovible en tissu. "
            "Format pochette de soirée ou mini-trousse de voyage. "
            "Dimensions : 22 × 14 cm."
        ),
        "origin": "Ghana",
        "price": "15.00",
        "old_price": None,
        "stock": 10,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Pochettes",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.45.jpeg",
    },
    {
        "name": "Tote Bag Denim & Wax Patchwork",
        "description": (
            "Grand tote bag en denim épais agrémenté de carrés de wax patchwork aux imprimés "
            "floraux et géométriques (rose, vert, noir). "
            "Anses renforcées en jean, fond cousu double épaisseur. "
            "Le mariage du denim occidental et du wax africain — robuste et coloré."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "65.00",
        "old_price": None,
        "stock": 3,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Tote Bags",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.45 (1).jpeg",
    },
    {
        "name": "Grand Sac de Voyage Wax Kente Jaune",
        "description": (
            "Grand sac de voyage type week-end en tissu wax kente jaune, noir et brun. "
            "Double anse portage main, longue bandoulière ajustable, fermeture éclair centrale. "
            "Deux poches latérales, contenance 35 L environ. "
            "Idéal pour un week-end, une escapade ou comme bagage cabine."
        ),
        "origin": "Ghana",
        "price": "75.00",
        "old_price": None,
        "stock": 3,
        "is_featured": True,
        "certification": "Artisanal",
        "subcategory": "Sacs de voyage",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.46.jpeg",
    },
    {
        "name": "Sac Bandoulière Wax Rouge à Volants",
        "description": (
            "Sac bandoulière romantique en wax rouge à motifs dorés agrémenté de trois rangs "
            "de volants froncés en cascade. Chaîne métal argentée amovible, fermeture éclair. "
            "Un accessoire audacieux qui transforme n'importe quelle tenue en look festif. "
            "Dimensions : 28 × 20 cm."
        ),
        "origin": "Afrique de l'Ouest",
        "price": "45.00",
        "old_price": None,
        "stock": 4,
        "is_featured": False,
        "certification": "Artisanal",
        "subcategory": "Sacs bandoulière",
        "image_file": "WhatsApp Image 2026-05-23 at 21.20.47.jpeg",
    },
]


class Command(BaseCommand):
    help = "Crée 10 produits bijoux et 10 produits sacs depuis les photos client"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Affiche ce qui serait cree sans rien ecrire en base",
        )
        parser.add_argument(
            "--bijoux-dir", default=_DEFAULT_BIJOUX,
            help="Chemin vers le dossier des photos bijoux",
        )
        parser.add_argument(
            "--sacs-dir", default=_DEFAULT_SACS,
            help="Chemin vers le dossier des photos sacs",
        )
        parser.add_argument(
            "--used-dir", default=_DEFAULT_USED,
            help="Dossier de destination des images utilisees",
        )

    def handle(self, *args, **options):
        from api.models import Category, Subcategory, Product, ProductImage

        dry_run   = options["dry_run"]
        BIJOUX_DIR = Path(options["bijoux_dir"])
        SACS_DIR   = Path(options["sacs_dir"])
        USED_DIR   = Path(options["used_dir"])
        if dry_run:
            self.stdout.write(self.style.WARNING("[DRY-RUN] aucune modification en base"))

        # ── Info chemins ──────────────────────────────────────────────────────
        self.stdout.write(f"Bijoux : {BIJOUX_DIR}")
        self.stdout.write(f"Sacs   : {SACS_DIR}")
        self.stdout.write(f"Used   : {USED_DIR}")

        # ── Dossier de destination des images utilisees ────────────────────────
        if not dry_run:
            USED_DIR.mkdir(parents=True, exist_ok=True)

        # ── Catégories ─────────────────────────────────────────────────────────
        cat_bijoux, _ = self._get_or_create(
            dry_run, Category,
            lookup={"slug": "bijoux-accessoires"},
            defaults={
                "universe": "mode",
                "name": "Bijoux & Accessoires",
                "description": "Bijoux artisanaux afro-caribéens : colliers, bracelets, boucles d'oreilles et ceintures.",
                "order": 2,
            },
        )
        cat_sacs, _ = self._get_or_create(
            dry_run, Category,
            lookup={"slug": "sacs-maroquinerie"},
            defaults={
                "universe": "mode",
                "name": "Sacs & Maroquinerie",
                "description": "Sacs artisanaux en wax, cuir et jute : pochettes, tote bags, sacs bandoulière.",
                "order": 3,
            },
        )

        # ── Sous-catégories bijoux ─────────────────────────────────────────────
        bijoux_subcats = {}
        for name in ["Colliers", "Bracelets & Parures", "Boucles d'oreilles", "Ceintures"]:
            slug = "bijoux-" + name.lower().replace(" ", "-").replace("&", "et").replace("'", "")
            sub, _ = self._get_or_create(
                dry_run, Subcategory,
                lookup={"slug": slug},
                defaults={"category": cat_bijoux, "name": name},
            )
            bijoux_subcats[name] = sub

        # ── Sous-catégories sacs ───────────────────────────────────────────────
        sacs_subcats = {}
        for name in ["Pochettes", "Sacs à main", "Sacs bandoulière", "Tote Bags", "Sacs de voyage"]:
            slug = "sacs-" + name.lower().replace(" ", "-").replace("à", "a").replace("è", "e").replace("'", "")
            sub, _ = self._get_or_create(
                dry_run, Subcategory,
                lookup={"slug": slug},
                defaults={"category": cat_sacs, "name": name},
            )
            sacs_subcats[name] = sub

        # ── Produits ───────────────────────────────────────────────────────────
        total_created = 0
        for data, category, subcats, src_dir in [
            (BIJOUX_PRODUCTS, cat_bijoux, bijoux_subcats, BIJOUX_DIR),
            (SACS_PRODUCTS,   cat_sacs,   sacs_subcats,   SACS_DIR),
        ]:
            for p in data:
                src_img = src_dir / p["image_file"]
                if not src_img.exists():
                    self.stdout.write(self.style.ERROR(f"  ✗ Image introuvable : {src_img}"))
                    continue

                self.stdout.write(f"  -> {p['name']} ({p['price']} EUR)")

                if not dry_run:
                    # Crée le produit
                    product, created = Product.objects.get_or_create(
                        name=p["name"],
                        defaults={
                            "category":      category,
                            "subcategory":   subcats.get(p["subcategory"]),
                            "description":   p["description"],
                            "origin":        p["origin"],
                            "price":         p["price"],
                            "old_price":     p["old_price"],
                            "stock":         p["stock"],
                            "is_active":     True,
                            "is_featured":   p["is_featured"],
                            "certification": p["certification"],
                        },
                    )

                    if created:
                        # Copie l'image vers media/products/ avec un nom propre
                        clean_name = self._clean_filename(p["name"]) + ".jpg"
                        dest_path  = Path(settings.MEDIA_ROOT) / "products" / clean_name
                        dest_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(src_img, dest_path)

                        # Crée le ProductImage
                        with open(dest_path, "rb") as f:
                            ProductImage.objects.create(
                                product=product,
                                image=File(f, name=f"products/{clean_name}"),
                                is_main=True,
                            )

                        # Déplace l'image source vers used/
                        shutil.move(str(src_img), str(USED_DIR / src_img.name))
                        total_created += 1
                        self.stdout.write(self.style.SUCCESS(f"     [OK] cree"))
                    else:
                        self.stdout.write(self.style.WARNING(f"     [SKIP] existe deja"))

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"\nDry-run termine -- {len(BIJOUX_PRODUCTS) + len(SACS_PRODUCTS)} produits seraient traites."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"\n[DONE] {total_created} produits crees. "
                f"Images sources deplacees vers : {USED_DIR}"
            ))

    # ── Helpers ────────────────────────────────────────────────────────────────
    def _get_or_create(self, dry_run, model, lookup, defaults):
        if dry_run:
            self.stdout.write(f"  [dry] {model.__name__} : {lookup}")
            return None, True
        obj, created = model.objects.get_or_create(**lookup, defaults=defaults)
        return obj, created

    @staticmethod
    def _clean_filename(name: str) -> str:
        """Transforme un nom de produit en nom de fichier ASCII sans espaces."""
        import unicodedata, re
        name = unicodedata.normalize("NFD", name)
        name = name.encode("ascii", "ignore").decode("ascii")
        name = re.sub(r"[^\w\s-]", "", name).strip().lower()
        return re.sub(r"[\s_-]+", "_", name)[:60]
