from django.db.models import Avg, Sum
from rest_framework import serializers
from .models import (
    Category, Subcategory, Product, ProductImage,
    Wishlist, PromoCode, Cart, CartItem,
    Order, OrderItem, NewsletterSubscriber, ProductReview, ShippingZone,
)


# ── Catégorie ─────────────────────────────────────────────────────────────────
class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Subcategory
        fields = ('id', 'name', 'slug')


class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubcategorySerializer(many=True, read_only=True)

    class Meta:
        model  = Category
        fields = ('id', 'universe', 'name', 'slug', 'description', 'image', 'subcategories')


# ── Produit ───────────────────────────────────────────────────────────────────
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ('id', 'image', 'is_main')


class ProductListSerializer(serializers.ModelSerializer):
    main_image       = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    category_name    = serializers.CharField(source='category.name', read_only=True)
    universe         = serializers.CharField(source='category.universe', read_only=True)

    class Meta:
        model  = Product
        fields = (
            'id', 'uid', 'name', 'slug', 'price', 'old_price',
            'discount_percent', 'main_image', 'stock', 'is_featured',
            'certification', 'category_name', 'universe',
        )


class ProductDetailSerializer(serializers.ModelSerializer):
    images           = ProductImageSerializer(many=True, read_only=True)
    main_image       = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    category         = CategorySerializer(read_only=True)
    sold_count       = serializers.SerializerMethodField()
    avg_rating       = serializers.SerializerMethodField()
    review_count     = serializers.SerializerMethodField()

    def get_sold_count(self, obj):
        result = OrderItem.objects.filter(
            product=obj,
            order__status__in=['paid', 'processing', 'shipped', 'delivered']
        ).aggregate(total=Sum('quantity'))['total']
        return result or 0

    def get_avg_rating(self, obj):
        result = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(result, 1) if result else None

    def get_review_count(self, obj):
        return obj.reviews.count()

    class Meta:
        model  = Product
        fields = (
            'id', 'uid', 'name', 'slug', 'description', 'origin',
            'price', 'old_price', 'discount_percent', 'main_image', 'images',
            'stock', 'is_featured', 'certification', 'category', 'date',
            'sold_count', 'avg_rating', 'review_count',
        )


# ── Wishlist ──────────────────────────────────────────────────────────────────
class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model  = Wishlist
        fields = ('id', 'product', 'date')


# ── Panier ────────────────────────────────────────────────────────────────────
class CartItemSerializer(serializers.ModelSerializer):
    product  = ProductListSerializer(read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model  = CartItem
        fields = ('id', 'product', 'quantity', 'subtotal')


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()

    class Meta:
        model  = Cart
        fields = ('id', 'cart_id', 'items', 'total')


# ── Code promo ────────────────────────────────────────────────────────────────
class PromoCodeCheckSerializer(serializers.Serializer):
    code           = serializers.CharField()
    mode_subtotal  = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    bio_subtotal   = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)


class PromoCodeSerializer(serializers.ModelSerializer):
    is_valid_now = serializers.SerializerMethodField()

    class Meta:
        model  = PromoCode
        fields = (
            'id', 'code', 'discount_type', 'discount_value', 'universe',
            'min_order', 'max_uses', 'used_count',
            'valid_from', 'valid_until', 'is_active', 'is_valid_now',
        )

    def get_is_valid_now(self, obj):
        return obj.is_valid()


# ── Commande ──────────────────────────────────────────────────────────────────
class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model  = OrderItem
        fields = ('id', 'product_name', 'product_price', 'quantity', 'subtotal')


class OrderSerializer(serializers.ModelSerializer):
    items             = OrderItemSerializer(many=True, read_only=True)
    total_discount    = serializers.ReadOnlyField()
    promo_code_used   = serializers.SerializerMethodField()   # legacy
    promos_breakdown  = serializers.SerializerMethodField()   # nouveau

    def get_promo_code_used(self, obj):
        # Rétrocompat : retourne le premier code trouvé
        if obj.promo_code_mode_id:
            return obj.promo_code_mode.code
        if obj.promo_code_bio_id:
            return obj.promo_code_bio.code
        return obj.promo_code.code if obj.promo_code_id else None

    def get_promos_breakdown(self, obj):
        result = []
        if obj.promo_code_mode_id:
            result.append({
                'code': obj.promo_code_mode.code,
                'universe': obj.promo_code_mode.universe,
                'discount': str(obj.discount_mode),
            })
        if obj.promo_code_bio_id:
            result.append({
                'code': obj.promo_code_bio.code,
                'universe': obj.promo_code_bio.universe,
                'discount': str(obj.discount_bio),
            })
        # Legacy : aucun code universel nouveau → on expose l'ancien
        if not result and obj.promo_code_id:
            result.append({
                'code': obj.promo_code.code,
                'universe': obj.promo_code.universe,
                'discount': str(obj.discount),
            })
        return result

    class Meta:
        model  = Order
        fields = (
            'id', 'oid', 'status', 'total', 'total_discount', 'shipping_cost',
            'full_name', 'email', 'phone',
            'address', 'city', 'postal_code', 'country',
            'items', 'promo_code_used', 'promos_breakdown', 'date',
        )
        read_only_fields = ('oid', 'status', 'date')


class OrderCreateSerializer(serializers.Serializer):
    cart_id       = serializers.UUIDField()
    full_name     = serializers.CharField(max_length=200)
    email         = serializers.EmailField()
    phone         = serializers.CharField(max_length=30, required=False, allow_blank=True)
    address       = serializers.CharField()
    city          = serializers.CharField(max_length=100)
    postal_code   = serializers.CharField(max_length=20, required=False, allow_blank=True)
    country       = serializers.CharField(max_length=100, default='Martinique')
    # Nouveau : liste de codes (max 2, univers différents)
    promo_codes   = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False, default=list, max_length=2,
    )
    shipping_cost  = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=0)
    utm_source     = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    utm_medium     = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    utm_campaign   = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    utm_content    = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    create_account = serializers.BooleanField(required=False, default=False)


# ── Zone de livraison ──────────────────────────────────────────────────────────
class ShippingZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShippingZone
        fields = ('id', 'name', 'destinations', 'cost', 'free_above', 'days_min', 'days_max')


# ── Admin — écriture produit ──────────────────────────────────────────────────
class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = (
            'name', 'category', 'subcategory', 'description', 'origin',
            'price', 'old_price', 'stock', 'certification', 'is_active', 'is_featured',
        )


class AdminProductSerializer(serializers.ModelSerializer):
    """Retourné par les endpoints admin — inclut is_active, images complètes, category_id."""
    images        = ProductImageSerializer(many=True, read_only=True)
    main_image    = serializers.ReadOnlyField()
    category_id   = serializers.IntegerField(source='category.id',       read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name',         read_only=True, allow_null=True)
    universe      = serializers.CharField(source='category.universe',     read_only=True, allow_null=True)
    discount_percent = serializers.ReadOnlyField()

    class Meta:
        model  = Product
        fields = (
            'id', 'uid', 'name', 'slug', 'description', 'origin',
            'price', 'old_price', 'discount_percent',
            'main_image', 'images',
            'stock', 'is_active', 'is_featured', 'certification',
            'category_id', 'category_name', 'universe', 'date',
        )


# ── Admin — écriture catégorie ────────────────────────────────────────────────
class CategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ('name', 'universe', 'description', 'image', 'order')


# ── Newsletter ────────────────────────────────────────────────────────────────
class NewsletterSubscribeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = NewsletterSubscriber
        fields = ('email', 'universe')


# ── Avis produit ──────────────────────────────────────────────────────────────
class ProductReviewSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()

    def get_user_display(self, obj):
        """Prénom + initiale du nom — ex: "Marie D." — jamais l'email complet."""
        name = (obj.user.full_name or '').strip()
        if name:
            parts = name.split()
            if len(parts) >= 2:
                return f'{parts[0]} {parts[-1][0]}.'
            return parts[0]
        # fallback : préfixe email
        return obj.user.email.split('@')[0].capitalize()

    class Meta:
        model  = ProductReview
        fields = ('id', 'user_display', 'rating', 'comment', 'verified', 'date')
