from django.contrib import admin
from .models import (
    Category, Subcategory, Product, ProductImage,
    Wishlist, PromoCode, Cart, CartItem,
    Order, OrderItem, NewsletterSubscriber, ProductReview, ShippingZone,
    ContactMessage,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display   = ('name', 'universe', 'order')
    list_filter    = ('universe',)
    prepopulated_fields = {'slug': ('name',)}
    ordering       = ('universe', 'order')


@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display   = ('name', 'category')
    list_filter    = ('category__universe',)
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines        = [ProductImageInline]
    list_display   = ('name', 'category', 'price', 'stock', 'is_active', 'is_featured', 'date')
    list_filter    = ('is_active', 'is_featured', 'category__universe', 'category')
    search_fields  = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable  = ('is_active', 'is_featured', 'stock')
    readonly_fields = ('uid',)


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'date')


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display  = ('code', 'discount_type', 'discount_value', 'used_count', 'is_active', 'valid_until')
    list_filter   = ('is_active', 'discount_type')


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    inlines     = [CartItemInline]
    list_display = ('cart_id', 'user', 'date')
    readonly_fields = ('cart_id',)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'product_price', 'quantity', 'subtotal')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines        = [OrderItemInline]
    list_display   = ('oid', 'full_name', 'email', 'total', 'status', 'date')
    list_filter    = ('status',)
    search_fields  = ('oid', 'email', 'full_name')
    readonly_fields = ('oid', 'date', 'sumup_checkout_id')
    list_editable  = ('status',)


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display  = ('product', 'user', 'rating', 'verified', 'date')
    list_filter   = ('rating', 'verified')
    search_fields = ('product__name', 'user__email')
    readonly_fields = ('verified', 'date')


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display  = ('name', 'cost', 'free_above', 'days_min', 'days_max', 'is_active')
    list_editable = ('cost', 'free_above', 'is_active')
    list_filter   = ('is_active',)
    search_fields = ('name', 'destinations')


@admin.register(NewsletterSubscriber)
class NewsletterAdmin(admin.ModelAdmin):
    list_display  = ('email', 'universe', 'is_active', 'date')
    list_filter   = ('universe', 'is_active')
    search_fields = ('email',)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display   = ('name', 'email', 'subject', 'is_read', 'date')
    list_filter    = ('is_read',)
    search_fields  = ('name', 'email', 'subject', 'message')
    list_editable  = ('is_read',)
    readonly_fields = ('name', 'email', 'subject', 'message', 'date')
    ordering       = ('-date',)
