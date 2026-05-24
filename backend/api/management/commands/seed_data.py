"""
python manage.py seed_data
Crée les catégories, sous-catégories et produits de démonstration
avec des images téléchargées depuis Unsplash.
"""
import urllib.request
import urllib.error
import time
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from api.models import Category, Subcategory, Product, ProductImage


# ── Helpers ────────────────────────────────────────────────────────────────
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; EthniSpirit-Seed/1.0)'}

def fetch_image(photo_id: str, filename: str, w: int = 600) -> ContentFile | None:
    url = f'https://images.unsplash.com/photo-{photo_id}?w={w}&q=85&auto=format&fit=crop'
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
            if len(data) > 5_000:          # fichier JPEG valide
                return ContentFile(data, name=filename)
        except Exception as e:
            print(f'    ↻ tentative {attempt+1} échouée pour {photo_id}: {e}')
            time.sleep(1)
    return None


def unique_slug(base: str, model) -> str:
    slug = slugify(base)
    if not model.objects.filter(slug=slug).exists():
        return slug
    for i in range(2, 99):
        candidate = f'{slug}-{i}'
        if not model.objects.filter(slug=candidate).exists():
            return candidate
    return f'{slug}-{int(time.time())}'


# ══════════════════════════════════════════════════════════════════════════════
#  DONNÉES
# ══════════════════════════════════════════════════════════════════════════════

MODE_CATEGORIES = [
    {
        'name': 'Vêtements',
        'universe': 'mode',
        'order': 1,
        'description': 'Robes wax, boubous et tenues africaines pour la femme caribéenne.',
        'photo_id': '1664151100152-333a5c85efbe',
        'subcategories': ['Robes', 'Ensembles', 'Boubous', 'Hauts'],
    },
    {
        'name': 'Bijoux',
        'universe': 'mode',
        'order': 2,
        'description': 'Colliers, bracelets et parures artisanaux d\'origine ivoirienne.',
        'photo_id': '1579624054375-72037da740e5',
        'subcategories': ['Colliers', 'Bracelets', 'Parures', 'Boucles d\'oreilles'],
    },
    {
        'name': 'Accessoires',
        'universe': 'mode',
        'order': 3,
        'description': 'Sacs, foulards et accessoires assortis en tissu africain.',
        'photo_id': '1768212565424-efa3a3852b81',
        'subcategories': ['Sacs', 'Foulards', 'Ceintures'],
    },
]

BIO_CATEGORIES = [
    {
        'name': 'Soins du corps',
        'universe': 'bio',
        'order': 1,
        'description': 'Huiles, beurres et crèmes naturels pour nourrir et sublimer la peau.',
        'photo_id': '1638131163449-70059e10de6a',
        'subcategories': ['Huiles', 'Beurres & Crèmes', 'Savons'],
    },
    {
        'name': 'Huiles Essentielles',
        'universe': 'bio',
        'order': 2,
        'description': 'Huiles essentielles pures d\'origine tropicale pour aromathérapie et soin.',
        'photo_id': '1595871522483-00a17611a5e3',
        'subcategories': ['Florales', 'Capillaires', 'Coffrets'],
    },
    {
        'name': 'Tisanes & Infusions',
        'universe': 'bio',
        'order': 3,
        'description': 'Tisanes caribéennes et tropicales : bien-être, détox et relaxation.',
        'photo_id': '1514733670139-4d87a1941d55',
        'subcategories': ['Relaxantes', 'Détox', 'Énergisantes'],
    },
    {
        'name': 'Alimentaire Bio',
        'universe': 'bio',
        'order': 4,
        'description': 'Miels, épices et superaliments bio d\'origine tropicale.',
        'photo_id': '1565206594704-0ee96fe6b62a',
        'subcategories': ['Miels', 'Épices', 'Superaliments'],
    },
]

MODE_PRODUCTS = [
    # ── Vêtements ──────────────────────────────────────────────────────────
    {
        'name':          'Robe Wax Abidjan',
        'category':      'Vêtements',
        'subcategory':   'Robes',
        'description':   'Robe longue en tissu wax 100 % coton aux motifs géométriques colorés. Coupe fluide et élégante, idéale pour les occasions festives ou le quotidien. Chaque pièce est unique, coupée et cousue à la main par nos artisans d\'Abidjan.',
        'origin':        "Côte d'Ivoire",
        'price':         85.00,
        'old_price':     105.00,
        'stock':         12,
        'is_featured':   True,
        'certification': 'Artisanal',
        'photo_id':      '1664151100152-333a5c85efbe',
    },
    {
        'name':          'Ensemble Boubou Satin Bleu',
        'category':      'Vêtements',
        'subcategory':   'Ensembles',
        'description':   'Ensemble 2 pièces : haut boubou et pantalon large en satin doux. Broderies dorées sur le col et les manches. Tenue de cérémonie et de mariage incontournable, confectionnée à Abidjan.',
        'origin':        "Côte d'Ivoire",
        'price':         120.00,
        'old_price':     None,
        'stock':         8,
        'is_featured':   True,
        'certification': 'Artisanal',
        'photo_id':      '1664151099736-1ac6365a25aa',
    },
    {
        'name':          'Robe Kente Festive Or & Vert',
        'category':      'Vêtements',
        'subcategory':   'Robes',
        'description':   'Robe mi-longue confectionnée en tissu kente traditionnel, aux rayures or et vert emblématiques. Symbole de prestige et d\'identité culturelle africaine. Coupe ajustée à la taille avec fentes latérales.',
        'origin':        "Ghana / Côte d'Ivoire",
        'price':         95.00,
        'old_price':     115.00,
        'stock':         6,
        'is_featured':   False,
        'certification': 'Artisanal',
        'photo_id':      '1650562325232-538b70cccb32',
    },
    {
        'name':          'Tenue Cérémonie Ankara Rose',
        'category':      'Vêtements',
        'subcategory':   'Robes',
        'description':   'Robe cérémonie en tissu ankara aux imprimés floraux rose et dorés. Encolure dégagée, manches longues et jupe volumineuse. Une pièce habillée parfaite pour baptêmes, mariages et fêtes caribéennes.',
        'origin':        "Côte d'Ivoire",
        'price':         110.00,
        'old_price':     None,
        'stock':         10,
        'is_featured':   True,
        'certification': 'Artisanal',
        'photo_id':      '1687052093309-7a14efa58ecb',
    },
    {
        'name':          'Boubou Brodé Royal',
        'category':      'Vêtements',
        'subcategory':   'Boubous',
        'description':   'Grand boubou ample en coton bazin riche, brodé à la main avec des fils d\'or sur le col et les poignets. Vêtement traditionnel par excellence, synonyme d\'élégance et de dignité en Afrique de l\'Ouest.',
        'origin':        "Côte d'Ivoire",
        'price':         75.00,
        'old_price':     90.00,
        'stock':         15,
        'is_featured':   False,
        'certification': 'Artisanal',
        'photo_id':      '1731595758910-9e9e3eda275b',
    },
    # ── Bijoux ─────────────────────────────────────────────────────────────
    {
        'name':          'Collier Perles Baoulé Multicolore',
        'category':      'Bijoux',
        'subcategory':   'Colliers',
        'description':   'Collier long en perles de verre multicolores aux tons chauds (ocre, rouge, turquoise, vert). Fabriqué à la main par les artisans Baoulé de Côte d\'Ivoire selon les techniques traditionnelles transmises de génération en génération.',
        'origin':        "Côte d'Ivoire",
        'price':         35.00,
        'old_price':     42.00,
        'stock':         20,
        'is_featured':   True,
        'certification': 'Artisanal',
        'photo_id':      '1579624054375-72037da740e5',
    },
    {
        'name':          'Parure Perles Korhogo Complète',
        'category':      'Bijoux',
        'subcategory':   'Parures',
        'description':   'Parure complète 3 pièces : collier ras-du-cou, bracelet et boucles d\'oreilles pendantes en perles de verre et fil de coton tressé. Inspirée des parures traditionnelles de la région de Korhogo, nord de la Côte d\'Ivoire.',
        'origin':        "Côte d'Ivoire",
        'price':         55.00,
        'old_price':     68.00,
        'stock':         9,
        'is_featured':   True,
        'certification': 'Artisanal',
        'photo_id':      '1757140448448-90ed1f18fcbb',
    },
    {
        'name':          'Collier Perles Rouges & Or',
        'category':      'Bijoux',
        'subcategory':   'Colliers',
        'description':   'Collier festif en perles rouges, dorées et noires aux reflets chauds. Longueur mi-longue avec pendentif central en métal doré. Pièce idéale pour mettre en valeur une robe wax ou un décolleté.',
        'origin':        "Côte d'Ivoire",
        'price':         42.00,
        'old_price':     None,
        'stock':         14,
        'is_featured':   False,
        'certification': 'Artisanal',
        'photo_id':      '1629481995102-ff98d306dd8a',
    },
    {
        'name':          'Bracelet Perles Traditionnel',
        'category':      'Bijoux',
        'subcategory':   'Bracelets',
        'description':   'Bracelet en perles de verre blanches et colorées, monté sur fil élastique résistant. Réglable pour s\'adapter à tous les poignets. Se porte en superposition pour un effet maximaliste typiquement africain.',
        'origin':        "Côte d'Ivoire",
        'price':         25.00,
        'old_price':     30.00,
        'stock':         30,
        'is_featured':   False,
        'certification': 'Artisanal',
        'photo_id':      '1612481193284-2225c95a15ed',
    },
    {
        'name':          'Bracelet Doré Artisanal Baoulé',
        'category':      'Bijoux',
        'subcategory':   'Bracelets',
        'description':   'Bracelet rigide plaqué or 18 carats, façonné à la main par un artisan orfèvre de Yamoussoukro. Finition mate avec motifs géométriques gravés. Pièce intemporelle qui accompagne aussi bien une tenue africaine que du prêt-à-porter.',
        'origin':        "Côte d'Ivoire",
        'price':         38.00,
        'old_price':     45.00,
        'stock':         11,
        'is_featured':   True,
        'certification': 'Artisanal',
        'photo_id':      '1613274146063-8930e164c743',
    },
]

BIO_PRODUCTS = [
    # ── Soins du corps ─────────────────────────────────────────────────────
    {
        'name':          'Huile de Coco Pure BIO',
        'category':      'Soins du corps',
        'subcategory':   'Huiles',
        'description':   'Huile de noix de coco vierge pressée à froid, non raffinée, 250 ml. Hydratation intense pour peau, cheveux et lèvres. Sans additifs ni conservateurs. Certifiée biologique, d\'origine tropicale, conditionnée en pot en verre recyclable.',
        'origin':        'Caraïbes / Sri Lanka',
        'price':         18.00,
        'old_price':     22.00,
        'stock':         40,
        'is_featured':   True,
        'certification': 'Certifié Bio',
        'photo_id':      '1560769680-ba2f3767c785',
    },
    {
        'name':          'Beurre de Karité Brut 200 g',
        'category':      'Soins du corps',
        'subcategory':   'Beurres & Crèmes',
        'description':   'Beurre de karité 100 % pur, non raffiné, extrait à froid de noix de karité du Burkina Faso. Riche en vitamines A, E et F. Nourrit, protège et répare la peau sèche. Idéal pour les peaux à tendance sèche sous les climats tropicaux.',
        'origin':        'Burkina Faso',
        'price':         22.00,
        'old_price':     None,
        'stock':         35,
        'is_featured':   True,
        'certification': 'Naturel',
        'photo_id':      '1598779795578-2afceafed88e',
    },
    {
        'name':          'Crème Corps Karité & Coco',
        'category':      'Soins du corps',
        'subcategory':   'Beurres & Crèmes',
        'description':   'Crème corps onctueuse 150 ml formulée avec 40 % de beurre de karité et huile de coco vierge. Texture fondante à absorption rapide, sans silicone ni paraben. Laisse la peau douce, lumineuse et légèrement parfumée aux notes tropicales.',
        'origin':        "Côte d'Ivoire",
        'price':         28.00,
        'old_price':     34.00,
        'stock':         25,
        'is_featured':   False,
        'certification': 'Naturel',
        'photo_id':      '1573812461383-e5f8b759d12e',
    },
    {
        'name':          'Savon Artisanal Beurre de Cacao',
        'category':      'Soins du corps',
        'subcategory':   'Savons',
        'description':   'Savon surgras 100 g fabriqué artisanalement à froid avec beurre de cacao, huile de palme durable et huile de coco. Mousse crémeuse, nettoie en douceur sans dessécher. Parfum naturel de cacao et vanille. Zéro déchet, emballé en papier kraft recyclé.',
        'origin':        "Côte d'Ivoire",
        'price':         12.00,
        'old_price':     None,
        'stock':         50,
        'is_featured':   False,
        'certification': 'Naturel',
        'photo_id':      '1564925211277-3ef36582cae1',
    },
    # ── Huiles Essentielles ────────────────────────────────────────────────
    {
        'name':          'Huile Essentielle Ylang-Ylang Pure',
        'category':      'Huiles Essentielles',
        'subcategory':   'Florales',
        'description':   'Huile essentielle d\'ylang-ylang 100 % pure et naturelle, 10 ml. Distillée à la vapeur d\'eau à partir de fleurs fraîches de Cananga odorata. Notes florales intenses, apaisantes et sensuelles. Utilisée en diffusion, massage (diluée) ou bain.',
        'origin':        'Madagascar',
        'price':         15.00,
        'old_price':     18.00,
        'stock':         28,
        'is_featured':   True,
        'certification': 'Certifié Bio',
        'photo_id':      '1671492246169-cdd6305870a0',
    },
    {
        'name':          'Huile de Ricin Fortifiante 100 ml',
        'category':      'Huiles Essentielles',
        'subcategory':   'Capillaires',
        'description':   'Huile de ricin biologique pressée à froid, 100 ml. Richesse exceptionnelle en acide ricinoléique (85 %) qui fortifie, épaissit et stimule la pousse des cheveux, sourcils et cils. Résultats visibles en 4 à 6 semaines.',
        'origin':        "Côte d'Ivoire",
        'price':         14.00,
        'old_price':     None,
        'stock':         32,
        'is_featured':   False,
        'certification': 'Certifié Bio',
        'photo_id':      '1671493228689-754b0f200c84',
    },
    {
        'name':          'Coffret 3 Huiles Essentielles Tropicales',
        'category':      'Huiles Essentielles',
        'subcategory':   'Coffrets',
        'description':   'Coffret cadeau composé de 3 huiles essentielles d\'origine tropicale : ylang-ylang (10 ml), citronnelle (10 ml) et vétiver (10 ml). Emballage kraft recyclable avec livret explicatif sur les utilisations et précautions. Idéal pour initiation à l\'aromathérapie.',
        'origin':        'Tropiques',
        'price':         38.00,
        'old_price':     45.00,
        'stock':         18,
        'is_featured':   True,
        'certification': 'Certifié Bio',
        'photo_id':      '1595871522483-00a17611a5e3',
    },
    # ── Tisanes ────────────────────────────────────────────────────────────
    {
        'name':          'Tisane Citronnelle & Gingembre',
        'category':      'Tisanes & Infusions',
        'subcategory':   'Relaxantes',
        'description':   'Mélange de tisane artisanal 50 g composé de citronnelle fraîche séchée des Caraïbes et de gingembre bio râpé. Infusion apaisante, digestive et légèrement épicée. Récoltée et séchée à la main en Martinique, sans additifs ni arômes artificiels.',
        'origin':        'Caraïbes / Martinique',
        'price':         9.00,
        'old_price':     None,
        'stock':         45,
        'is_featured':   True,
        'certification': 'Naturel',
        'photo_id':      '1514733670139-4d87a1941d55',
    },
    {
        'name':          'Tisane Hibiscus Caribéen Détox',
        'category':      'Tisanes & Infusions',
        'subcategory':   'Détox',
        'description':   'Fleurs d\'hibiscus (Hibiscus sabdariffa) séchées, 50 g. Aussi appelé "groseille pays" aux Caraïbes, le bissap est riche en antioxydants et en vitamine C. Préparé chaud ou en thé glacé, il offre une boisson naturellement rouge, acidulée et rafraîchissante.',
        'origin':        'Caraïbes / Sénégal',
        'price':         10.00,
        'old_price':     12.00,
        'stock':         38,
        'is_featured':   False,
        'certification': 'Naturel',
        'photo_id':      '1536597680100-ac32d9c5b0e7',
    },
    # ── Alimentaire ────────────────────────────────────────────────────────
    {
        'name':          'Miel Tropical BIO 250 g',
        'category':      'Alimentaire Bio',
        'subcategory':   'Miels',
        'description':   'Miel brut non chauffé 250 g, récolté auprès d\'apiculteurs traditionnels des zones tropicales. Nectar de fleurs sauvages tropicales : hibiscus, flamboyant, vétiver. Texture crémeuse, notes florales et caramel. Certifié biologique, sans filtration excessive ni pasteurisation.',
        'origin':        'Caraïbes / Tropiques',
        'price':         16.00,
        'old_price':     None,
        'stock':         22,
        'is_featured':   True,
        'certification': 'Certifié Bio',
        'photo_id':      '1676313779351-9648c6eaae8a',
    },
]

# Images supplémentaires par produit (angles différents)
EXTRA_IMAGES = {
    'Robe Wax Abidjan':                    ['1664151099399-d41ed991a10d'],
    'Ensemble Boubou Satin Bleu':          ['1664151100152-333a5c85efbe'],
    'Parure Perles Korhogo Complète':      ['1757140448528-332c4fa2a8a6'],
    'Collier Perles Baoulé Multicolore':   ['1574362098421-38623a3466b5'],
    'Bracelet Doré Artisanal Baoulé':      ['1744472457504-f99a96ecbd3e'],
    'Huile de Coco Pure BIO':              ['1588413333412-82148535db53'],
    'Beurre de Karité Brut 200 g':         ['1573812461383-e5f8b759d12e'],
    'Coffret 3 Huiles Essentielles Tropicales': ['1671493228689-754b0f200c84'],
    'Tisane Citronnelle & Gingembre':      ['1603199940491-3aa23df82899'],
    'Miel Tropical BIO 250 g':             ['1565206594704-0ee96fe6b62a'],
}


# ══════════════════════════════════════════════════════════════════════════════
#  COMMANDE
# ══════════════════════════════════════════════════════════════════════════════

class Command(BaseCommand):
    help = 'Seed EthniSpirit avec catégories, sous-catégories et produits (+ images Unsplash)'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true', help='Supprimer les données existantes avant de seeder')

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write('🗑  Suppression des données existantes...')
            ProductImage.objects.all().delete()
            Product.objects.all().delete()
            Subcategory.objects.all().delete()
            Category.objects.all().delete()

        self.stdout.write('🌱 Démarrage du seed EthniSpirit...\n')

        mode_cats  = self._seed_categories(MODE_CATEGORIES)
        bio_cats   = self._seed_categories(BIO_CATEGORIES)
        all_cats   = {**mode_cats, **bio_cats}

        mode_subs  = self._seed_subcategories(MODE_CATEGORIES, mode_cats)
        bio_subs   = self._seed_subcategories(BIO_CATEGORIES, bio_cats)
        all_subs   = {**mode_subs, **bio_subs}

        self._seed_products(MODE_PRODUCTS, all_cats, all_subs)
        self._seed_products(BIO_PRODUCTS,  all_cats, all_subs)

        self.stdout.write(self.style.SUCCESS(
            f'\n[OK] Seed terminé !\n'
            f'   Catégories : {Category.objects.count()}\n'
            f'   Sous-catégories : {Subcategory.objects.count()}\n'
            f'   Produits : {Product.objects.count()}\n'
            f'   Images produits : {ProductImage.objects.count()}'
        ))

    # ── Catégories ──────────────────────────────────────────────────────────
    def _seed_categories(self, definitions: list) -> dict:
        result = {}
        for d in definitions:
            cat, created = Category.objects.get_or_create(
                name=d['name'],
                universe=d['universe'],
                defaults={
                    'slug':        unique_slug(d['name'], Category),
                    'description': d['description'],
                    'order':       d['order'],
                },
            )
            action = '✚ créée' if created else '= existante'
            self.stdout.write(f'  [{d["universe"]}] Catégorie {cat.name} {action}')

            if created and d.get('photo_id'):
                img = fetch_image(d['photo_id'], f"cat_{slugify(d['name'])}.jpg", w=800)
                if img:
                    cat.image.save(f"cat_{slugify(d['name'])}.jpg", img, save=True)
                    self.stdout.write(f'        📷 image téléchargée')
                else:
                    self.stdout.write(f'        ⚠ image indisponible')

            result[d['name']] = cat
        return result

    # ── Sous-catégories ─────────────────────────────────────────────────────
    def _seed_subcategories(self, definitions: list, cat_map: dict) -> dict:
        result = {}
        for d in definitions:
            cat = cat_map.get(d['name'])
            if not cat:
                continue
            for sub_name in d.get('subcategories', []):
                base_slug = f"{cat.slug}-{slugify(sub_name)}"
                sub, created = Subcategory.objects.get_or_create(
                    category=cat,
                    name=sub_name,
                    defaults={'slug': unique_slug(base_slug, Subcategory)},
                )
                action = '✚' if created else '='
                self.stdout.write(f'    {action} Sous-cat: {cat.name} > {sub.name}')
                result[f"{d['name']}>{sub_name}"] = sub
        return result

    # ── Produits ────────────────────────────────────────────────────────────
    def _seed_products(self, definitions: list, cat_map: dict, sub_map: dict):
        self.stdout.write('')
        for d in definitions:
            # Vérifier si déjà existant
            if Product.objects.filter(name=d['name']).exists():
                self.stdout.write(f'  = Produit déjà existant : {d["name"]}')
                continue

            cat = cat_map.get(d['category'])
            sub_key = f"{d['category']}>{d['subcategory']}"
            sub = sub_map.get(sub_key)

            # Slug unique
            slug = unique_slug(d['name'], Product)

            p = Product.objects.create(
                name          = d['name'],
                slug          = slug,
                category      = cat,
                subcategory   = sub,
                description   = d['description'],
                origin        = d['origin'],
                price         = d['price'],
                old_price     = d.get('old_price'),
                stock         = d['stock'],
                is_active     = True,
                is_featured   = d.get('is_featured', False),
                certification = d.get('certification', ''),
            )
            self.stdout.write(f'  ✚ Produit: {p.name}  ({d["category"]})')

            # Image principale
            img = fetch_image(d['photo_id'], f"prod_{slug}.jpg")
            if img:
                pi = ProductImage(product=p, is_main=True)
                pi.image.save(f"prod_{slug}.jpg", img, save=True)
                self.stdout.write(f'      📷 image principale OK')
            else:
                self.stdout.write(f'      ⚠ image principale manquante')

            # Images supplémentaires
            for idx, extra_id in enumerate(EXTRA_IMAGES.get(d['name'], []), start=1):
                extra_img = fetch_image(extra_id, f"prod_{slug}_extra{idx}.jpg")
                if extra_img:
                    pi2 = ProductImage(product=p, is_main=False)
                    pi2.image.save(f"prod_{slug}_extra{idx}.jpg", extra_img, save=True)
                    self.stdout.write(f'      📷 image extra {idx} OK')
