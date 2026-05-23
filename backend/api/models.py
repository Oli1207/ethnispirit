import uuid
from decimal import Decimal
from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

from userauths.models import User


# ── Helpers ────────────────────────────────────────────────────────────────────
UNIVERSE_CHOICES = [
    ('mode', 'Mode Antillaise'),
    ('bio',  'Bio & Naturel'),
]


# ── Catégorie ─────────────────────────────────────────────────────────────────
class Category(models.Model):
    universe    = models.CharField(max_length=10, choices=UNIVERSE_CHOICES, default='mode')
    name        = models.CharField(max_length=100)
    slug        = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    image       = models.ImageField(upload_to='categories/', blank=True, null=True)
    order       = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Catégories'
        ordering = ['universe', 'order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'[{self.universe}] {self.name}'




# ── Sous-catégorie ────────────────────────────────────────────────────────────
class Subcategory(models.Model):
    category    = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name        = models.CharField(max_length=100)
    slug        = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        verbose_name_plural = 'Sous-catégories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.category.slug}-{slugify(self.name)}"
            self.slug = base
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.category.name} > {self.name}'


# ── Produit ───────────────────────────────────────────────────────────────────
class Product(models.Model):
    uid             = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    category        = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    subcategory     = models.ForeignKey(Subcategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name            = models.CharField(max_length=200)
    slug            = models.SlugField(max_length=220, unique=True, blank=True)
    description     = models.TextField(blank=True)
    origin          = models.CharField(max_length=100, blank=True, help_text="Origine géographique (ex: Côte d'Ivoire)")
    price           = models.DecimalField(max_digits=10, decimal_places=2)
    old_price       = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    stock           = models.PositiveIntegerField(default=0)
    is_active       = models.BooleanField(default=True)
    is_featured     = models.BooleanField(default=False)
    certification   = models.CharField(max_length=100, blank=True, help_text="Ex: Bio, Naturel, Artisanal")
    date            = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or 'produit'
            slug = base
            n = 1
            qs = Product.objects.exclude(pk=self.pk) if self.pk else Product.objects.all()
            while qs.filter(slug=slug).exists():
                slug = f'{base}-{n}'
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def discount_percent(self):
        if self.old_price and self.old_price > self.price:
            return int((1 - self.price / self.old_price) * 100)
        return 0

    @property
    def main_image(self):
        img = self.images.filter(is_main=True).first()
        if img:
            return img.image.url
        img = self.images.first()
        return img.image.url if img else None

    def __str__(self):
        return self.name


# ── Images produit ────────────────────────────────────────────────────────────
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image   = models.ImageField(upload_to='products/')
    is_main = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Images produit'

    def __str__(self):
        return f'Image — {self.product.name}'


# ── Wishlist ──────────────────────────────────────────────────────────────────
class Wishlist(models.Model):
    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    date    = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f'{self.user.email} — {self.product.name}'


# ── Code promo ────────────────────────────────────────────────────────────────
class PromoCode(models.Model):
    DISCOUNT_TYPE = [
        ('percent', 'Pourcentage'),
        ('fixed',   'Montant fixe'),
    ]
    UNIVERSE_CHOICES = [
        ('mode', 'Mode Antillaise uniquement'),
        ('bio',  'Bio & Naturel uniquement'),
        ('all',  'Tous les univers'),
    ]

    code           = models.CharField(max_length=50, unique=True)
    discount_type  = models.CharField(max_length=10, choices=DISCOUNT_TYPE, default='percent')
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    min_order      = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_uses       = models.PositiveIntegerField(default=0, help_text="0 = illimité")
    used_count     = models.PositiveIntegerField(default=0)
    valid_from     = models.DateTimeField()
    valid_until    = models.DateTimeField()
    is_active      = models.BooleanField(default=True)
    universe       = models.CharField(
        max_length=10, choices=UNIVERSE_CHOICES, default='all',
        help_text="Détermine sur quel(s) article(s) la réduction s'applique",
    )

    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.valid_from or now > self.valid_until:
            return False
        if self.max_uses > 0 and self.used_count >= self.max_uses:
            return False
        return True

    def compute_discount(self, subtotal):
        """Calcule la remise sur le sous-total de l'univers concerné."""
        if not self.is_valid():
            return Decimal('0')
        if Decimal(str(subtotal)) < self.min_order:
            return Decimal('0')
        if self.discount_type == 'percent':
            return (Decimal(str(subtotal)) * self.discount_value / 100).quantize(Decimal('0.01'))
        return min(self.discount_value, Decimal(str(subtotal)))

    def __str__(self):
        return f'{self.code} ({self.get_universe_display()})'


# ── Panier ─────────────────────────────────────────────────────────────────────
class Cart(models.Model):
    cart_id              = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user                 = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='carts')
    date                 = models.DateTimeField(auto_now_add=True)
    # Panier abandonné
    email                = models.EmailField(blank=True, default='')
    checkout_started_at  = models.DateTimeField(null=True, blank=True)
    abandoned_email_sent = models.BooleanField(default=False)

    def __str__(self):
        return str(self.cart_id)

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    cart     = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product  = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f'{self.product.name} x{self.quantity}'

    @property
    def subtotal(self):
        return self.product.price * self.quantity


# ── Commande ──────────────────────────────────────────────────────────────────
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending',    'En attente'),
        ('paid',       'Payée'),
        ('processing', 'En traitement'),
        ('shipped',    'Expédiée'),
        ('delivered',  'Livrée'),
        ('cancelled',  'Annulée'),
    ]
    oid             = models.CharField(max_length=20, unique=True, editable=False)
    user            = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='orders')
    status          = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    total           = models.DecimalField(max_digits=10, decimal_places=2)
    # Legacy — conservé pour les commandes existantes (null sur les nouvelles)
    discount        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_code      = models.ForeignKey(PromoCode, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='orders_legacy')
    # Multi-promo par univers
    promo_code_mode = models.ForeignKey(PromoCode, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='orders_mode')
    promo_code_bio  = models.ForeignKey(PromoCode, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='orders_bio')
    discount_mode   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_bio    = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    @property
    def total_discount(self):
        """Remise totale — utilise les champs granulaires si disponibles, sinon legacy."""
        if self.discount_mode or self.discount_bio:
            return self.discount_mode + self.discount_bio
        return self.discount
    # Livraison
    full_name       = models.CharField(max_length=200)
    email           = models.EmailField()
    phone           = models.CharField(max_length=30, blank=True)
    address         = models.TextField()
    city            = models.CharField(max_length=100)
    postal_code     = models.CharField(max_length=20, blank=True)
    country         = models.CharField(max_length=100, default='Martinique')
    # Livraison
    shipping_cost   = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    # Attribution marketing
    utm_source   = models.CharField(max_length=100, blank=True)
    utm_medium   = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)
    utm_content  = models.CharField(max_length=100, blank=True)

    # Paiement (Stripe Checkout Session)
    stripe_session_id = models.CharField(max_length=200, blank=True)
    # Anciens champs conservés pour compatibilité
    stripe_payment_intent = models.CharField(max_length=200, blank=True)
    sumup_checkout_id     = models.CharField(max_length=200, blank=True)
    date            = models.DateTimeField(auto_now_add=True)
    # Email d'avis post-achat
    review_email_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if not self.oid:
            prefix = 'ETH-'
            last = Order.objects.filter(oid__startswith=prefix).order_by('-date').first()
            if last:
                try:
                    num = int(last.oid.replace(prefix, '')) + 1
                except ValueError:
                    num = 1
            else:
                num = 1
            self.oid = f'{prefix}{num:05d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.oid


class OrderItem(models.Model):
    order       = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product     = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=200)  # snapshot
    product_price = models.DecimalField(max_digits=10, decimal_places=2)  # snapshot
    quantity    = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.product_price * self.quantity

    def __str__(self):
        return f'{self.product_name} x{self.quantity}'


# ── Avis produit ──────────────────────────────────────────────────────────────
class ProductReview(models.Model):
    product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating   = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment  = models.TextField(blank=True)
    verified = models.BooleanField(default=False)  # achat confirmé
    date     = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-date']
        verbose_name = 'Avis produit'
        verbose_name_plural = 'Avis produits'

    def __str__(self):
        return f'{self.user.email} — {self.product.name} — {self.rating}★'


# ── Zone de livraison ─────────────────────────────────────────────────────────
class ShippingZone(models.Model):
    name         = models.CharField(max_length=100)
    destinations = models.TextField(
        help_text="Destinations séparées par virgule (ex: Martinique, Fort-de-France)"
    )
    cost         = models.DecimalField(max_digits=8, decimal_places=2)
    free_above   = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        help_text="Livraison gratuite si sous-total >= ce montant (0 = jamais gratuit)"
    )
    days_min     = models.PositiveSmallIntegerField(default=3)
    days_max     = models.PositiveSmallIntegerField(default=7)
    is_active    = models.BooleanField(default=True)

    def get_cost(self, subtotal):
        if self.free_above > 0 and Decimal(str(subtotal)) >= self.free_above:
            return Decimal('0.00')
        return self.cost

    class Meta:
        ordering = ['name']
        verbose_name        = 'Zone de livraison'
        verbose_name_plural = 'Zones de livraison'

    def __str__(self):
        return self.name


# ── Analytics ─────────────────────────────────────────────────────────────────
class AnalyticsSession(models.Model):
    DEVICE_CHOICES = [('mobile', 'Mobile'), ('tablet', 'Tablette'), ('desktop', 'Desktop')]

    session_id   = models.CharField(max_length=64, unique=True, db_index=True)
    user         = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='analytics_sessions')

    # Géolocalisation
    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    city         = models.CharField(max_length=100, blank=True, db_index=True)
    region       = models.CharField(max_length=100, blank=True)
    country      = models.CharField(max_length=100, blank=True)
    latitude     = models.FloatField(null=True, blank=True)
    longitude    = models.FloatField(null=True, blank=True)

    # Appareil
    device_type  = models.CharField(max_length=10, choices=DEVICE_CHOICES, blank=True)
    browser      = models.CharField(max_length=80, blank=True)
    os           = models.CharField(max_length=80, blank=True)

    # Source
    referrer     = models.CharField(max_length=500, blank=True)
    landing_page = models.CharField(max_length=500, blank=True)
    utm_source   = models.CharField(max_length=100, blank=True, db_index=True)
    utm_medium   = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)
    utm_content  = models.CharField(max_length=100, blank=True)

    first_seen   = models.DateTimeField(auto_now_add=True, db_index=True)
    last_seen    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-first_seen']
        verbose_name        = 'Session'
        verbose_name_plural = 'Sessions analytiques'

    def __str__(self):
        return f'{self.session_id[:8]}… — {self.city or "?"} — {self.device_type}'


class AnalyticsEvent(models.Model):
    EVENT_CHOICES = [
        ('pageview',             'Page vue'),
        ('product_view',         'Vue produit'),
        ('add_to_cart',          'Ajout panier'),
        ('remove_from_cart',     'Retrait panier'),
        ('begin_checkout',       'Début checkout'),
        ('promo_applied',        'Code promo appliqué'),
        ('purchase',             'Achat'),
        ('signup',               'Inscription'),
        ('newsletter_subscribe', 'Abonnement newsletter'),
        ('wishlist_add',         'Ajout favoris'),
        ('search',               'Recherche'),
    ]

    session      = models.ForeignKey(AnalyticsSession, on_delete=models.CASCADE, related_name='events')
    event_type   = models.CharField(max_length=30, choices=EVENT_CHOICES, db_index=True)

    page_url     = models.CharField(max_length=500, blank=True)
    product_id   = models.IntegerField(null=True, blank=True)
    product_name = models.CharField(max_length=200, blank=True)
    universe     = models.CharField(max_length=10, blank=True)
    value        = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    order_oid    = models.CharField(max_length=20, blank=True)
    extra        = models.JSONField(default=dict, blank=True)

    timestamp    = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name        = 'Événement'
        verbose_name_plural = 'Événements analytiques'

    def __str__(self):
        return f'{self.event_type} — {self.session.session_id[:8]}…'


# ── Message de contact ────────────────────────────────────────────────────────
class ContactMessage(models.Model):
    name    = models.CharField(max_length=200)
    email   = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    date    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name        = 'Message de contact'
        verbose_name_plural = 'Messages de contact'

    def __str__(self):
        return f'[{self.subject}] {self.name} <{self.email}>'


# ── Modal de bienvenue (singleton) ────────────────────────────────────────────
class WelcomePromoSettings(models.Model):
    """
    Singleton — toujours pk=1.
    Configurable depuis l'interface admin sans toucher au code.
    """
    UNIVERSE_CHOICES = [
        ('all',  'Tous les univers'),
        ('mode', 'Mode Antillaise'),
        ('bio',  'Bio & Naturel'),
    ]
    is_active     = models.BooleanField(default=True, verbose_name='Actif')
    universe      = models.CharField(max_length=10, choices=UNIVERSE_CHOICES, default='all',
                                     verbose_name='Univers d\'affichage',
                                     help_text='Sur quel site afficher ce modal')
    title         = models.CharField(max_length=200, default='Bienvenue !', verbose_name='Titre')
    subtitle      = models.CharField(max_length=300, default='1ère commande', verbose_name='Sous-titre')
    promo_code    = models.CharField(max_length=50,  default='ETHNI10',        verbose_name='Code promo')
    discount_text = models.CharField(max_length=100, default='10% de réduction', verbose_name='Texte réduction')
    body_text     = models.TextField(blank=True,     default='',               verbose_name='Texte complémentaire')
    delay_seconds = models.PositiveIntegerField(default=3, verbose_name='Délai avant affichage (s)')

    class Meta:
        verbose_name        = 'Modal de bienvenue'
        verbose_name_plural = 'Modal de bienvenue'

    def save(self, *args, **kwargs):
        self.pk = 1          # garantit le singleton
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f'Modal bienvenue — {"actif" if self.is_active else "inactif"}'


# ── Demande de produit ────────────────────────────────────────────────────────
class ProductRequest(models.Model):
    name        = models.CharField(max_length=200, blank=True)
    email       = models.EmailField(blank=True)
    description = models.TextField()
    photo       = models.ImageField(upload_to='product_requests/', blank=True, null=True)
    is_handled  = models.BooleanField(default=False)
    date        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name        = 'Demande de produit'
        verbose_name_plural = 'Demandes de produit'

    def __str__(self):
        return f'Demande — {self.name or "Anonyme"} — {self.date.strftime("%d/%m/%Y")}'


# ── Newsletter ────────────────────────────────────────────────────────────────
class NewsletterSubscriber(models.Model):
    email     = models.EmailField(unique=True)
    universe  = models.CharField(max_length=10, choices=UNIVERSE_CHOICES, default='mode')
    is_active = models.BooleanField(default=True)
    date      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


# ── Alertes stock bas (singleton) ────────────────────────────────────────────
class StockAlertSettings(models.Model):
    """
    Singleton — toujours pk=1.
    Configuré depuis l'interface admin ou l'endpoint dédié.
    """
    threshold = models.IntegerField(default=5, help_text="Seuil en dessous duquel alerter")
    email     = models.EmailField(blank=True, help_text="Email de notification (laisser vide pour désactiver)")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name        = 'Paramètres alertes stock'
        verbose_name_plural = 'Paramètres alertes stock'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f'Alertes stock — seuil={self.threshold} — {"actif" if self.is_active else "inactif"}'


# ── Notification rupture de stock ─────────────────────────────────────────────
class RestockNotification(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='restock_notifications')
    email      = models.EmailField()
    phone      = models.CharField(max_length=30, blank=True)
    notified   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'email')
        verbose_name        = 'Notification réapprovisionnement'
        verbose_name_plural = 'Notifications réapprovisionnement'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.email} — {self.product.name}'


