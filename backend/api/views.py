from decimal import Decimal
from django.db import transaction, IntegrityError
from django.db.models import F
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .throttles import PromoCheckThrottle
from .models import (
    Category, Product, ProductImage, Wishlist, PromoCode,
    Cart, CartItem, Order, OrderItem, NewsletterSubscriber, ProductReview, ShippingZone,
    ContactMessage, AnalyticsSession, AnalyticsEvent, WelcomePromoSettings,
    StockAlertSettings, RestockNotification, ProductRequest,
)
from .serializers import (
    CategorySerializer, CategoryWriteSerializer,
    ProductListSerializer, ProductDetailSerializer,
    AdminProductSerializer, ProductWriteSerializer,
    WishlistSerializer, CartSerializer, CartItemSerializer,
    OrderSerializer, OrderCreateSerializer,
    PromoCodeCheckSerializer, PromoCodeSerializer, NewsletterSubscribeSerializer,
    ProductReviewSerializer,
)
from . import stripe_service


# ── Catégories ────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def categories_list(request):
    universe = request.query_params.get('universe')
    qs = Category.objects.prefetch_related('subcategories')
    if universe:
        qs = qs.filter(universe=universe)
    serializer = CategorySerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


# ── Produits ──────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def products_list(request):
    qs = Product.objects.filter(is_active=True).select_related('category')

    universe = request.query_params.get('universe')
    category = request.query_params.get('category')
    featured = request.query_params.get('featured')
    search   = request.query_params.get('search')

    if universe:
        qs = qs.filter(category__universe=universe)
    if category:
        qs = qs.filter(category__slug=category)
    if featured == '1':
        qs = qs.filter(is_featured=True)
    if search:
        qs = qs.filter(name__icontains=search)

    serializer = ProductListSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_detail(request, slug):
    try:
        product = Product.objects.prefetch_related('images').select_related('category').get(slug=slug, is_active=True)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = ProductDetailSerializer(product, context={'request': request})
    return Response(serializer.data)


# ── Wishlist ──────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wishlist_list(request):
    qs = Wishlist.objects.filter(user=request.user).select_related('product')
    serializer = WishlistSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def wishlist_toggle(request, product_id):
    try:
        product = Product.objects.get(id=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    obj, created = Wishlist.objects.get_or_create(user=request.user, product=product)
    if not created:
        obj.delete()
        return Response({'status': 'removed'})
    return Response({'status': 'added'}, status=status.HTTP_201_CREATED)


# ── Panier ────────────────────────────────────────────────────────────────────
def _get_or_create_cart(cart_id_str):
    """Récupère ou crée un panier à partir du UUID string fourni par le client."""
    try:
        cart_id = str(cart_id_str)
        cart, _ = Cart.objects.get_or_create(cart_id=cart_id)
    except Exception:
        cart = Cart.objects.create()
    return cart


@api_view(['GET'])
@permission_classes([AllowAny])
def cart_detail(request):
    cart_id = request.query_params.get('cart_id')
    if not cart_id:
        return Response({'error': 'cart_id requis.'}, status=status.HTTP_400_BAD_REQUEST)
    cart = _get_or_create_cart(cart_id)
    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def cart_add(request):
    cart_id    = request.data.get('cart_id')
    product_id = request.data.get('product_id')
    quantity   = int(request.data.get('quantity', 1))

    if not cart_id or not product_id:
        return Response({'error': 'cart_id et product_id requis.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(id=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    cart = _get_or_create_cart(cart_id)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    if not created:
        item.quantity += quantity
    else:
        item.quantity = quantity
    item.save()

    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def cart_update(request, item_id):
    quantity = request.data.get('quantity')
    if quantity is None:
        return Response({'error': 'quantity requis.'}, status=status.HTTP_400_BAD_REQUEST)

    # Vérification de propriété : le cart_id doit correspondre au panier de l'item
    cart_id = request.data.get('cart_id')
    try:
        item = CartItem.objects.select_related('cart').get(id=item_id)
    except CartItem.DoesNotExist:
        return Response({'error': 'Article introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if cart_id and str(item.cart.cart_id) != str(cart_id):
        return Response({'error': 'Accès non autorisé à cet article.'}, status=status.HTTP_403_FORBIDDEN)

    quantity = int(quantity)
    if quantity <= 0:
        item.delete()
    else:
        item.quantity = quantity
        item.save()

    serializer = CartSerializer(item.cart, context={'request': request})
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def cart_remove(request, item_id):
    # Vérification de propriété : le cart_id doit correspondre au panier de l'item
    cart_id = request.query_params.get('cart_id')
    try:
        item = CartItem.objects.select_related('cart').get(id=item_id)
    except CartItem.DoesNotExist:
        return Response({'error': 'Article introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if cart_id and str(item.cart.cart_id) != str(cart_id):
        return Response({'error': 'Accès non autorisé à cet article.'}, status=status.HTTP_403_FORBIDDEN)

    cart = item.cart
    item.delete()
    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data)


# ── Code promo (rate-limité : 30 checks/minute par IP) ───────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PromoCheckThrottle])
def promo_check(request):
    serializer = PromoCodeCheckSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    code          = serializer.validated_data['code']
    mode_subtotal = serializer.validated_data['mode_subtotal']
    bio_subtotal  = serializer.validated_data['bio_subtotal']

    try:
        promo = PromoCode.objects.get(code__iexact=code)
    except PromoCode.DoesNotExist:
        return Response({'error': 'Code promo invalide.'}, status=status.HTTP_404_NOT_FOUND)

    if not promo.is_valid():
        return Response({'error': 'Code promo expiré ou inactif.'}, status=status.HTTP_400_BAD_REQUEST)

    # Déterminer le sous-total applicable selon l'univers du code
    if promo.universe == 'mode':
        if mode_subtotal == 0:
            return Response(
                {'error': 'Ce code s\'applique uniquement aux articles Mode Antillaise.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        applicable = mode_subtotal
    elif promo.universe == 'bio':
        if bio_subtotal == 0:
            return Response(
                {'error': 'Ce code s\'applique uniquement aux articles Bio & Naturel.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        applicable = bio_subtotal
    else:  # 'all'
        applicable = mode_subtotal + bio_subtotal

    discount = promo.compute_discount(applicable)
    return Response({
        'code':                promo.code,
        'universe':            promo.universe,
        'discount_type':       promo.discount_type,
        'discount_value':      str(promo.discount_value),
        'discount':            str(discount),
        'applicable_subtotal': str(applicable),
    })


# ── Livraison ─────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def shipping_quote(request):
    """
    GET /api/shipping/quote/?destination=Martinique&subtotal=120.00
    Retourne la zone correspondante + coût calculé (gratuit si seuil atteint).
    Fallback sur une zone par défaut si aucune zone ne correspond.
    """
    destination = request.query_params.get('destination', 'Martinique').strip()
    try:
        subtotal = Decimal(str(request.query_params.get('subtotal', '0')))
    except Exception:
        subtotal = Decimal('0')

    matched_zone = None
    for zone in ShippingZone.objects.filter(is_active=True):
        dest_list = [d.strip().lower() for d in zone.destinations.split(',')]
        if destination.lower() in dest_list:
            matched_zone = zone
            break

    if matched_zone:
        cost    = matched_zone.get_cost(subtotal)
        is_free = cost == Decimal('0.00')
        return Response({
            'zone':       matched_zone.name,
            'cost':       str(cost),
            'free_above': str(matched_zone.free_above),
            'days_min':   matched_zone.days_min,
            'days_max':   matched_zone.days_max,
            'is_free':    is_free,
        })

    # ── Fallback (aucune zone configurée ou destination inconnue) ──────────────
    # Ces valeurs seront remplacées dès que l'admin ajoute des zones
    FALLBACK = {
        'Martinique':                      {'cost': '6.00',  'free_above': '80.00',  'days_min': 3, 'days_max': 5},
        'Guadeloupe':                      {'cost': '6.00',  'free_above': '80.00',  'days_min': 3, 'days_max': 5},
        'Saint-Martin':                    {'cost': '8.00',  'free_above': '100.00', 'days_min': 4, 'days_max': 7},
        'Saint-Barthélemy':                {'cost': '8.00',  'free_above': '100.00', 'days_min': 4, 'days_max': 7},
        'Guyane':                          {'cost': '10.00', 'free_above': '120.00', 'days_min': 5, 'days_max': 8},
        'La Réunion':                      {'cost': '10.00', 'free_above': '120.00', 'days_min': 5, 'days_max': 8},
        'Île-de-France':                   {'cost': '8.50',  'free_above': '90.00',  'days_min': 3, 'days_max': 5},
        'Autre (France métropolitaine)':   {'cost': '8.50',  'free_above': '90.00',  'days_min': 3, 'days_max': 5},
    }
    fb = FALLBACK.get(destination, {'cost': '9.00', 'free_above': '0', 'days_min': 5, 'days_max': 10})
    cost = Decimal('0.00') if fb['free_above'] != '0' and subtotal >= Decimal(fb['free_above']) else Decimal(fb['cost'])
    return Response({
        'zone':       destination,
        'cost':       str(cost),
        'free_above': fb['free_above'],
        'days_min':   fb['days_min'],
        'days_max':   fb['days_max'],
        'is_free':    cost == Decimal('0.00'),
    })


# ── Commandes ─────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def orders_list(request):
    qs = Order.objects.filter(user=request.user).select_related('promo_code').prefetch_related('items')
    serializer = OrderSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, oid):
    try:
        order = Order.objects.select_related('promo_code').prefetch_related('items').get(oid=oid, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def order_create(request):
    serializer = OrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    try:
        cart = Cart.objects.prefetch_related('items__product').get(cart_id=data['cart_id'])
    except Cart.DoesNotExist:
        return Response({'error': 'Panier introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if not cart.items.exists():
        return Response({'error': 'Le panier est vide.'}, status=status.HTTP_400_BAD_REQUEST)

    # ── Création de compte invité (optionnelle) ──────────────────────────────
    account_created = False
    if data.get('create_account') and not request.user.is_authenticated:
        from django.conf import settings as dj_settings
        from django.core.mail import send_mail
        from userauths.models import User as AuthUser
        import secrets as _secrets
        email = data['email']
        # Mot de passe temporaire aléatoire (16 caractères alphanum) — jamais en dur
        temp_password = _secrets.token_urlsafe(12)
        if not AuthUser.objects.filter(email=email).exists():
            # Username unique : préfixe + 6 caractères aléatoires pour éviter les collisions
            import secrets as _s
            base_username = email.split('@')[0][:20]
            unique_suffix = _s.token_hex(3)  # ex: "a1b2c3"
            username = f"{base_username}_{unique_suffix}"
            new_user = AuthUser.objects.create_user(
                email     = email,
                username  = username,
                password  = temp_password,
                full_name = data['full_name'],
            )
            account_created = True
            # Email de bienvenue avec identifiants
            try:
                send_mail(
                    subject='Votre compte EthniSpirit a été créé',
                    message=(
                        f"Bonjour {data['full_name']},\n\n"
                        f"Votre compte a été créé automatiquement lors de votre commande.\n\n"
                        f"Identifiants de connexion :\n"
                        f"  Email    : {email}\n"
                        f"  Mot de passe : {temp_password}\n\n"
                        f"Connectez-vous sur : {dj_settings.FRONTEND_URL}/login\n\n"
                        f"Pensez à changer votre mot de passe depuis votre espace personnel.\n\n"
                        f"À bientôt,\nL'équipe EthniSpirit"
                    ),
                    from_email=dj_settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=True,
                )
            except Exception:
                pass

    # ── Sous-totaux par univers ──────────────────────────────────────────────
    mode_subtotal = Decimal('0')
    bio_subtotal  = Decimal('0')
    for ci in cart.items.select_related('product__category').all():
        universe   = (ci.product.category.universe if ci.product.category else 'mode') or 'mode'
        item_total = ci.product.price * ci.quantity
        if universe == 'bio':
            bio_subtotal += item_total
        else:
            mode_subtotal += item_total
    total = mode_subtotal + bio_subtotal

    # ── Application des codes promo (max 2, univers différents) ─────────────
    promo_mode    = None
    promo_bio     = None
    discount_mode = Decimal('0')
    discount_bio  = Decimal('0')
    promo_legacy  = None      # legacy field (promo_code) — resté null avec le nouveau système
    discount      = Decimal('0')

    for code_str in (data.get('promo_codes') or []):
        if not code_str:
            continue
        try:
            promo = PromoCode.objects.get(code__iexact=code_str.strip())
        except PromoCode.DoesNotExist:
            continue
        if not promo.is_valid():
            continue

        if promo.universe == 'mode' and promo_mode is None:
            discount_mode = promo.compute_discount(mode_subtotal)
            promo_mode    = promo
            PromoCode.objects.filter(id=promo.id).update(used_count=F('used_count') + 1)
        elif promo.universe == 'bio' and promo_bio is None:
            discount_bio = promo.compute_discount(bio_subtotal)
            promo_bio    = promo
            PromoCode.objects.filter(id=promo.id).update(used_count=F('used_count') + 1)
        elif promo.universe == 'all' and promo_mode is None and promo_bio is None:
            # Code universel : s'applique au total global, stocké dans le slot mode
            discount_mode = promo.compute_discount(total)
            promo_mode    = promo
            PromoCode.objects.filter(id=promo.id).update(used_count=F('used_count') + 1)

    shipping_cost  = Decimal(str(data.get('shipping_cost', 0) or 0))
    total_discount = discount_mode + discount_bio
    final_total    = max(total - total_discount + shipping_cost, Decimal('0'))

    with transaction.atomic():
        # ── Vérification stock et disponibilité ──────────────────────────────
        cart_items = list(cart.items.select_related('product').all())
        product_ids = [ci.product_id for ci in cart_items]
        locked_products = {
            p.id: p for p in
            Product.objects.select_for_update().filter(id__in=product_ids)
        }

        unavailable = []
        insufficient = []
        for ci in cart_items:
            p = locked_products.get(ci.product_id)
            if not p or not p.is_active:
                unavailable.append(ci.product.name)
            elif p.stock < ci.quantity:
                remaining = p.stock
                if remaining == 0:
                    unavailable.append(ci.product.name)
                else:
                    insufficient.append(
                        f"{p.name} (seulement {remaining} disponible{'s' if remaining > 1 else ''})"
                    )

        if unavailable:
            return Response({
                'error': (
                    f"Le(s) produit(s) suivant(s) ne sont plus disponibles : "
                    f"{', '.join(unavailable)}. "
                    f"Veuillez les retirer de votre panier."
                )
            }, status=status.HTTP_409_CONFLICT)

        if insufficient:
            return Response({
                'error': (
                    f"Stock insuffisant pour : {', '.join(insufficient)}. "
                    f"Veuillez réduire les quantités."
                )
            }, status=status.HTTP_409_CONFLICT)

        # ── Création commande ────────────────────────────────────────────────
        order = Order.objects.create(
            user           = request.user if request.user.is_authenticated else None,
            total          = final_total,
            discount       = discount,         # legacy — 0 dans le nouveau système
            discount_mode  = discount_mode,
            discount_bio   = discount_bio,
            shipping_cost  = shipping_cost,
            promo_code     = promo_legacy,     # legacy — None dans le nouveau système
            promo_code_mode= promo_mode,
            promo_code_bio = promo_bio,
            full_name      = data['full_name'],
            email          = data['email'],
            phone          = data.get('phone', ''),
            address        = data['address'],
            city           = data['city'],
            postal_code    = data.get('postal_code', ''),
            country        = data.get('country', 'Martinique'),
            utm_source     = data.get('utm_source', ''),
            utm_medium     = data.get('utm_medium', ''),
            utm_campaign   = data.get('utm_campaign', ''),
            utm_content    = data.get('utm_content', ''),
        )
        for ci in cart_items:
            OrderItem.objects.create(
                order         = order,
                product       = ci.product,
                product_name  = ci.product.name,
                product_price = ci.product.price,
                quantity      = ci.quantity,
            )

    # Création de la Stripe Checkout Session
    try:
        session = stripe_service.create_checkout_session(order)
        order.stripe_session_id = session.id
        order.save(update_fields=['stripe_session_id'])
        checkout_url = session.url
    except Exception as e:
        # Stripe a échoué — on annule l'ordre pour ne pas laisser d'orphelin
        order.delete()
        return Response(
            {'error': f'Impossible d\'initialiser le paiement Stripe : {str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({
        'oid':             order.oid,
        'total':           str(order.total),
        'checkout_url':    checkout_url,
        'account_created': account_created,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def order_payment_verify(request, oid):
    """
    Appelé depuis PaymentSuccessScreen avec session_id.
    Vérifie la Stripe Checkout Session et marque la commande payée si besoin.
    Compatible avec le flow : Stripe → redirect → frontend → POST ici.
    """
    session_id = request.data.get('session_id')

    if not session_id:
        return Response({'error': 'session_id requis.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        try:
            order = Order.objects.select_for_update().prefetch_related('items').get(oid=oid)
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Déjà payée — retourner sans retraiter
        if order.status == 'paid':
            serializer = OrderSerializer(order)
            return Response(serializer.data)

        try:
            session = stripe_service.retrieve_session(session_id)
        except Exception:
            # Stripe inaccessible ou clé non configurée : retourner la commande telle quelle.
            # Le webhook Stripe se chargera de marquer le statut 'paid' quand il arrivera.
            serializer = OrderSerializer(order)
            return Response({
                **serializer.data,
                '_stripe_pending': True,
            })

        # ── Vérification anti-fraude : la session doit appartenir à cette commande ──
        # Sans ce contrôle, un attaquant pourrait réutiliser une session payée d'une
        # autre commande (même de 0,01 €) pour marquer n'importe quelle commande comme payée.
        if session.metadata.get('order_oid') != order.oid:
            return Response(
                {'error': 'Session de paiement invalide pour cette commande.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if session.payment_status == 'paid':
            order.status = 'paid'
            order.save(update_fields=['status'])
            # ── Décrémente le stock de chaque article ────────────────────────
            for item in order.items.all():
                if item.product_id:
                    Product.objects.filter(id=item.product_id).update(
                        stock=F('stock') - item.quantity
                    )
                    # Alerte stock bas
                    _check_stock_alert(item.product_id)
            # ── Email de confirmation post-paiement ───────────────────────────
            _send_order_confirmation_email(order)
            serializer = OrderSerializer(order)
            return Response(serializer.data)

        elif session.payment_status == 'unpaid':
            # Session créée mais paiement pas encore confirmé (peut arriver en test)
            serializer = OrderSerializer(order)
            return Response({
                **serializer.data,
                '_stripe_pending': True,
            })

        else:
            return Response({'error': 'Paiement annulé ou invalide.'}, status=status.HTTP_400_BAD_REQUEST)


# ── Avis produit ─────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def product_reviews_list(request, slug):
    try:
        product = Product.objects.get(slug=slug, is_active=True)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    reviews = product.reviews.select_related('user').all()
    serializer = ProductReviewSerializer(reviews, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def product_review_create(request, slug):
    try:
        product = Product.objects.get(slug=slug, is_active=True)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if ProductReview.objects.filter(user=request.user, product=product).exists():
        return Response({'error': 'Vous avez déjà noté ce produit.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rating = int(request.data.get('rating', 0))
        if not (1 <= rating <= 5):
            raise ValueError
    except (TypeError, ValueError):
        return Response({'error': 'Note invalide (1 à 5 requis).'}, status=status.HTTP_400_BAD_REQUEST)

    comment  = request.data.get('comment', '').strip()
    verified = Order.objects.filter(
        user=request.user,
        status__in=['paid', 'processing', 'shipped', 'delivered'],
        items__product=product,
    ).exists()

    review = ProductReview.objects.create(
        product=product,
        user=request.user,
        rating=rating,
        comment=comment,
        verified=verified,
    )
    return Response(ProductReviewSerializer(review).data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def product_review_delete(request, slug):
    try:
        product = Product.objects.get(slug=slug)
        review  = ProductReview.objects.get(user=request.user, product=product)
    except (Product.DoesNotExist, ProductReview.DoesNotExist):
        return Response({'error': 'Avis introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    review.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Formulaire de contact ─────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def contact_send(request):
    from django.conf import settings
    from django.core.mail import send_mail

    name    = request.data.get('name', '').strip()
    email   = request.data.get('email', '').strip()
    subject = request.data.get('subject', '').strip()
    message = request.data.get('message', '').strip()

    if not all([name, email, subject, message]):
        return Response({'error': 'Tous les champs sont requis.'}, status=status.HTTP_400_BAD_REQUEST)

    # Sauvegarde en base
    ContactMessage.objects.create(name=name, email=email, subject=subject, message=message)

    recipient = getattr(settings, 'CONTACT_RECIPIENT', 'contact@ethnispirit.fr')

    # Email de notification à l'équipe
    admin_body = (
        f"Nouveau message de contact reçu sur EthniSpirit.\n\n"
        f"Nom    : {name}\n"
        f"Email  : {email}\n"
        f"Sujet  : {subject}\n\n"
        f"Message :\n{message}\n\n"
        f"---\nRépondre directement à : {email}"
    )
    try:
        send_mail(
            subject=f"[Contact EthniSpirit] {subject}",
            message=admin_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )
    except Exception:
        pass  # Ne jamais bloquer l'utilisateur si l'email échoue

    # Email de confirmation à l'expéditeur
    confirm_body = (
        f"Bonjour {name},\n\n"
        f"Nous avons bien reçu votre message concernant « {subject} ».\n"
        f"Notre équipe vous répondra dans les meilleurs délais (sous 24 h ouvrées).\n\n"
        f"Votre message :\n\"{message}\"\n\n"
        f"À bientôt,\nL'équipe EthniSpirit\ncontact@ethnispirit.fr"
    )
    try:
        send_mail(
            subject="Nous avons bien reçu votre message — EthniSpirit",
            message=confirm_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception:
        pass

    return Response({'message': 'Message envoyé avec succès.'}, status=status.HTTP_201_CREATED)


# ── Admin — Messages de contact ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_contacts_list(request):
    qs = ContactMessage.objects.all().order_by('-date')
    data = list(qs.values('id', 'name', 'email', 'subject', 'message', 'is_read', 'date'))
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_contact_mark_read(request, msg_id):
    try:
        msg = ContactMessage.objects.get(id=msg_id)
    except ContactMessage.DoesNotExist:
        return Response({'error': 'Message introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    msg.is_read = not msg.is_read
    msg.save(update_fields=['is_read'])
    return Response({'is_read': msg.is_read})


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_contact_delete(request, msg_id):
    try:
        ContactMessage.objects.get(id=msg_id).delete()
    except ContactMessage.DoesNotExist:
        return Response({'error': 'Message introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Demande de produit ────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def product_request_create(request):
    from django.conf import settings
    from django.core.mail import send_mail

    description = request.data.get('description', '').strip()
    if not description:
        return Response({'error': 'La description est requise.'}, status=status.HTTP_400_BAD_REQUEST)

    name  = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    photo = request.FILES.get('photo')

    pr = ProductRequest.objects.create(
        name=name,
        email=email,
        description=description,
        photo=photo,
    )

    recipient = getattr(settings, 'CONTACT_RECIPIENT', 'contact@ethnispirit.fr')
    photo_line = f'\nPhoto jointe : {request.build_absolute_uri(pr.photo.url)}' if pr.photo else ''

    admin_body = (
        f"Nouvelle demande de produit sur EthniSpirit.\n\n"
        f"Nom     : {name or 'Non renseigné'}\n"
        f"Email   : {email or 'Non renseigné'}\n\n"
        f"Description :\n{description}"
        f"{photo_line}\n\n"
        f"---\nConsultez toutes les demandes dans l'administration."
    )
    try:
        send_mail(
            subject="[EthniSpirit] Nouvelle demande de produit",
            message=admin_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )
    except Exception:
        pass

    if email:
        confirm_body = (
            f"Bonjour{' ' + name if name else ''},\n\n"
            f"Nous avons bien reçu votre demande de produit.\n"
            f"Notre équipe va l'examiner et fera son possible pour vous trouver ce que vous cherchez.\n\n"
            f"Votre demande :\n\"{description}\"\n\n"
            f"À bientôt,\nL'équipe EthniSpirit\ncontact@ethnispirit.fr"
        )
        try:
            send_mail(
                subject="Nous avons bien reçu votre demande — EthniSpirit",
                message=confirm_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception:
            pass

    return Response({'message': 'Demande envoyée avec succès.'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_product_requests_list(request):
    qs = ProductRequest.objects.all().order_by('-date')
    data = []
    for pr in qs:
        data.append({
            'id':          pr.id,
            'name':        pr.name,
            'email':       pr.email,
            'description': pr.description,
            'photo':       request.build_absolute_uri(pr.photo.url) if pr.photo else None,
            'is_handled':  pr.is_handled,
            'date':        pr.date,
        })
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_product_request_handle(request, req_id):
    try:
        pr = ProductRequest.objects.get(id=req_id)
    except ProductRequest.DoesNotExist:
        return Response({'error': 'Demande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    pr.is_handled = not pr.is_handled
    pr.save(update_fields=['is_handled'])
    return Response({'is_handled': pr.is_handled})


# ── Newsletter ────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def newsletter_subscribe(request):
    serializer = NewsletterSubscribeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email    = serializer.validated_data['email']
    universe = serializer.validated_data.get('universe', 'mode')

    obj, created = NewsletterSubscriber.objects.get_or_create(
        email=email,
        defaults={'universe': universe, 'is_active': True}
    )
    if not created:
        if not obj.is_active:
            obj.is_active = True
            obj.save(update_fields=['is_active'])
        return Response({'message': 'Vous êtes déjà inscrit(e).'})

    return Response({'message': 'Inscription réussie. Merci !'}, status=status.HTTP_201_CREATED)


# ── Newsletter — liste admin ──────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def newsletter_subscribers(request):
    from .serializers import NewsletterSubscribeSerializer
    qs = NewsletterSubscriber.objects.all().order_by('-date')
    data = list(qs.values('email', 'universe', 'is_active', 'date'))
    return Response(data)


# ── Commande — mise à jour statut (admin) ─────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def order_update_status(request, oid):
    try:
        order = Order.objects.get(oid=oid)
    except Order.DoesNotExist:
        return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    new_status = request.data.get('status')
    if new_status:
        order.status = new_status
        order.save(update_fields=['status'])
    return Response({'status': order.status})


# ── Commandes — liste admin (toutes) ─────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_orders_list(request):
    qs = Order.objects.all().select_related('promo_code').prefetch_related('items').order_by('-date')
    serializer = OrderSerializer(qs, many=True)
    return Response(serializer.data)


# ── Admin — CRUD Produits ─────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_products_list(request):
    qs     = Product.objects.prefetch_related('images').select_related('category').order_by('-date')
    search = request.query_params.get('search', '')
    if search:
        qs = qs.filter(name__icontains=search)
    return Response(AdminProductSerializer(qs, many=True, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_product_create(request):
    serializer = ProductWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        with transaction.atomic():
            product = serializer.save()
            images = request.FILES.getlist('images')
            for i, img in enumerate(images):
                ProductImage.objects.create(product=product, image=img, is_main=(i == 0))
    except IntegrityError:
        return Response(
            {'error': 'Un produit avec un nom très similaire existe déjà. Veuillez utiliser un nom légèrement différent.'},
            status=status.HTTP_409_CONFLICT,
        )
    return Response(
        AdminProductSerializer(product, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_product_update(request, product_id):
    try:
        product = Product.objects.prefetch_related('images').get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = ProductWriteSerializer(product, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        with transaction.atomic():
            product   = serializer.save()
            images    = request.FILES.getlist('images')
            has_main  = product.images.filter(is_main=True).exists()
            for img in images:
                ProductImage.objects.create(product=product, image=img, is_main=(not has_main))
                has_main = True
    except IntegrityError:
        return Response(
            {'error': 'Un produit avec un nom très similaire existe déjà. Veuillez utiliser un nom légèrement différent.'},
            status=status.HTTP_409_CONFLICT,
        )
    # Vérification alerte stock bas après mise à jour
    _check_stock_alert(product.id)
    return Response(AdminProductSerializer(product, context={'request': request}).data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_product_delete(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    product.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_product_image_delete(request, image_id):
    try:
        img = ProductImage.objects.select_related('product').get(id=image_id)
    except ProductImage.DoesNotExist:
        return Response({'error': 'Image introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    was_main = img.is_main
    product  = img.product
    img.image.delete(save=False)
    img.delete()
    if was_main:
        first = product.images.first()
        if first:
            first.is_main = True
            first.save(update_fields=['is_main'])
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin — CRUD Catégories ───────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_category_create(request):
    serializer = CategoryWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    category = serializer.save()
    return Response(
        CategorySerializer(category, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_category_update(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'error': 'Catégorie introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = CategoryWriteSerializer(category, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    category = serializer.save()
    return Response(CategorySerializer(category, context={'request': request}).data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_category_delete(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'error': 'Catégorie introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    category.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin — CRUD Zones de livraison ──────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_shipping_list(request):
    zones = ShippingZone.objects.all()
    return Response([{
        'id':           z.id,
        'name':         z.name,
        'destinations': z.destinations,
        'cost':         str(z.cost),
        'free_above':   str(z.free_above),
        'days_min':     z.days_min,
        'days_max':     z.days_max,
        'is_active':    z.is_active,
    } for z in zones])


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_shipping_create(request):
    zone = ShippingZone.objects.create(
        name         = request.data.get('name', ''),
        destinations = request.data.get('destinations', ''),
        cost         = Decimal(str(request.data.get('cost', 0))),
        free_above   = Decimal(str(request.data.get('free_above', 0))),
        days_min     = int(request.data.get('days_min', 3)),
        days_max     = int(request.data.get('days_max', 7)),
        is_active    = bool(request.data.get('is_active', True)),
    )
    return Response({
        'id': zone.id, 'name': zone.name, 'destinations': zone.destinations,
        'cost': str(zone.cost), 'free_above': str(zone.free_above),
        'days_min': zone.days_min, 'days_max': zone.days_max, 'is_active': zone.is_active,
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_shipping_update(request, zone_id):
    try:
        zone = ShippingZone.objects.get(id=zone_id)
    except ShippingZone.DoesNotExist:
        return Response({'error': 'Zone introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    for field, cast in [('name', str), ('destinations', str)]:
        if field in request.data:
            setattr(zone, field, cast(request.data[field]))
    for field in ['cost', 'free_above']:
        if field in request.data:
            setattr(zone, field, Decimal(str(request.data[field])))
    for field in ['days_min', 'days_max']:
        if field in request.data:
            setattr(zone, field, int(request.data[field]))
    if 'is_active' in request.data:
        val = request.data['is_active']
        zone.is_active = val if isinstance(val, bool) else str(val).lower() == 'true'
    zone.save()
    return Response({
        'id': zone.id, 'name': zone.name, 'destinations': zone.destinations,
        'cost': str(zone.cost), 'free_above': str(zone.free_above),
        'days_min': zone.days_min, 'days_max': zone.days_max, 'is_active': zone.is_active,
    })


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_shipping_delete(request, zone_id):
    try:
        ShippingZone.objects.get(id=zone_id).delete()
    except ShippingZone.DoesNotExist:
        return Response({'error': 'Zone introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin — statistiques ───────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    from django.db.models import Sum, Count
    total_orders   = Order.objects.count()
    revenue        = Order.objects.filter(status='paid').aggregate(r=Sum('total'))['r'] or 0
    total_products = Product.objects.filter(is_active=True).count()
    total_clients  = Order.objects.values('email').distinct().count()
    return Response({
        'total_orders':   total_orders,
        'revenue':        str(revenue),
        'total_products': total_products,
        'total_clients':  total_clients,
    })


# ── Admin — Commande détail ───────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_order_detail(request, oid):
    try:
        order = Order.objects.prefetch_related('items').select_related('promo_code').get(oid=oid)
    except Order.DoesNotExist:
        return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order).data)


# ── Admin — Codes promo CRUD ──────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_promo_list(request):
    qs = PromoCode.objects.all().order_by('-id')
    return Response(PromoCodeSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_promo_create(request):
    serializer = PromoCodeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    promo = serializer.save()
    return Response(PromoCodeSerializer(promo).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_promo_update(request, promo_id):
    try:
        promo = PromoCode.objects.get(id=promo_id)
    except PromoCode.DoesNotExist:
        return Response({'error': 'Code promo introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = PromoCodeSerializer(promo, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    promo = serializer.save()
    return Response(PromoCodeSerializer(promo).data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_promo_delete(request, promo_id):
    try:
        PromoCode.objects.get(id=promo_id).delete()
    except PromoCode.DoesNotExist:
        return Response({'error': 'Code promo introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


# ══════════════════════════════════════════════════════════════════════════════
# TRACKING & ANALYTICS
# ══════════════════════════════════════════════════════════════════════════════

def _get_geo(ip):
    """Résout une adresse IP en données géographiques via GeoLite2-City."""
    from django.conf import settings
    import geoip2.database, geoip2.errors
    result = {'city': '', 'region': '', 'country': '', 'latitude': None, 'longitude': None}
    if not ip or ip in ('127.0.0.1', '::1', 'localhost'):
        return result
    try:
        with geoip2.database.Reader(settings.GEOIP2_DB_PATH) as reader:
            r = reader.city(ip)
            result['city']      = r.city.name or ''
            result['region']    = r.subdivisions.most_specific.name or ''
            result['country']   = r.country.name or ''
            result['latitude']  = float(r.location.latitude)  if r.location.latitude  else None
            result['longitude'] = float(r.location.longitude) if r.location.longitude else None
    except Exception:
        pass
    return result


def _get_device(user_agent_str):
    """Analyse le User-Agent pour détecter l'appareil, le navigateur et l'OS."""
    from user_agents import parse as ua_parse
    if not user_agent_str:
        return {'device_type': '', 'browser': '', 'os': ''}
    ua = ua_parse(user_agent_str)
    if ua.is_mobile:
        device_type = 'mobile'
    elif ua.is_tablet:
        device_type = 'tablet'
    else:
        device_type = 'desktop'
    return {
        'device_type': device_type,
        'browser':     ua.browser.family or '',
        'os':          ua.os.family or '',
    }


def _get_real_ip(request):
    """Retourne l'IP réelle du client (gère les proxys / Nginx)."""
    from ipware import get_client_ip
    ip, _ = get_client_ip(request)
    return ip or ''


# ── Créer / récupérer une session analytics ───────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def track_session(request):
    data       = request.data
    session_id = data.get('session_id', '').strip()
    if not session_id:
        return Response({'error': 'session_id requis.'}, status=status.HTTP_400_BAD_REQUEST)

    # Si la session existe déjà on la retourne sans re-géolocaliser
    try:
        session = AnalyticsSession.objects.get(session_id=session_id)
        return Response({'created': False, 'city': session.city, 'country': session.country})
    except AnalyticsSession.DoesNotExist:
        pass

    ip     = _get_real_ip(request)
    geo    = _get_geo(ip)
    device = _get_device(request.META.get('HTTP_USER_AGENT', ''))

    session = AnalyticsSession.objects.create(
        session_id   = session_id,
        user         = request.user if request.user.is_authenticated else None,
        ip_address   = ip or None,
        city         = geo['city'],
        region       = geo['region'],
        country      = geo['country'],
        latitude     = geo['latitude'],
        longitude    = geo['longitude'],
        device_type  = device['device_type'],
        browser      = device['browser'],
        os           = device['os'],
        referrer     = data.get('referrer', '')[:500],
        landing_page = data.get('landing_page', '')[:500],
        utm_source   = data.get('utm_source', '')[:100],
        utm_medium   = data.get('utm_medium', '')[:100],
        utm_campaign = data.get('utm_campaign', '')[:100],
        utm_content  = data.get('utm_content', '')[:100],
    )
    return Response({'created': True, 'city': session.city, 'country': session.country},
                    status=status.HTTP_201_CREATED)


# ── Enregistrer un événement ──────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def track_event(request):
    data       = request.data
    session_id = data.get('session_id', '').strip()
    event_type = data.get('event_type', '').strip()

    if not session_id or not event_type:
        return Response({'error': 'session_id et event_type requis.'}, status=status.HTTP_400_BAD_REQUEST)

    # Valider contre les types d'événements autorisés (évite le stockage de données arbitraires)
    ALLOWED_EVENTS = {
        'pageview', 'product_view', 'add_to_cart', 'remove_from_cart',
        'begin_checkout', 'promo_applied', 'purchase', 'signup',
        'newsletter_subscribe', 'wishlist_add', 'search',
    }
    if event_type not in ALLOWED_EVENTS:
        return Response({'error': 'event_type non reconnu.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session = AnalyticsSession.objects.get(session_id=session_id)
    except AnalyticsSession.DoesNotExist:
        return Response({'error': 'Session inconnue.'}, status=status.HTTP_404_NOT_FOUND)

    # Mettre à jour last_seen
    from django.utils import timezone as tz
    AnalyticsSession.objects.filter(session_id=session_id).update(last_seen=tz.now())

    AnalyticsEvent.objects.create(
        session      = session,
        event_type   = event_type,
        page_url     = data.get('page_url', '')[:500],
        product_id   = data.get('product_id'),
        product_name = data.get('product_name', '')[:200],
        universe     = data.get('universe', '')[:10],
        value        = data.get('value') or None,
        order_oid    = data.get('order_oid', '')[:20],
        extra        = data.get('extra', {}),
    )
    return Response({'ok': True}, status=status.HTTP_201_CREATED)


# ── Dashboard analytics admin ─────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_analytics(request):
    from django.db.models import Sum, Count, Avg
    from django.db.models.functions import TruncDate
    from django.utils import timezone
    import datetime

    days   = int(request.query_params.get('days', 30))
    since  = timezone.now() - datetime.timedelta(days=days)

    # ── 1. Revenus par jour ────────────────────────────────────────────────────
    revenue_qs = (
        Order.objects
        .filter(status='paid', date__gte=since)
        .annotate(day=TruncDate('date'))
        .values('day')
        .annotate(revenue=Sum('total'), orders=Count('id'))
        .order_by('day')
    )
    revenue_chart = [
        {'date': str(r['day']), 'revenue': float(r['revenue']), 'orders': r['orders']}
        for r in revenue_qs
    ]

    # ── 2. Entonnoir de conversion ────────────────────────────────────────────
    sessions_total  = AnalyticsSession.objects.filter(first_seen__gte=since).count()
    product_views   = AnalyticsEvent.objects.filter(event_type='product_view',   timestamp__gte=since).values('session_id').distinct().count()
    add_to_carts    = AnalyticsEvent.objects.filter(event_type='add_to_cart',    timestamp__gte=since).values('session_id').distinct().count()
    begin_checkouts = AnalyticsEvent.objects.filter(event_type='begin_checkout', timestamp__gte=since).values('session_id').distinct().count()
    purchases       = AnalyticsEvent.objects.filter(event_type='purchase',       timestamp__gte=since).values('session_id').distinct().count()

    def pct(a, b):
        return round(a / b * 100, 1) if b else 0

    funnel = [
        {'label': 'Sessions',        'count': sessions_total,  'pct': 100},
        {'label': 'Vues produit',     'count': product_views,   'pct': pct(product_views,   sessions_total)},
        {'label': 'Ajouts panier',    'count': add_to_carts,    'pct': pct(add_to_carts,    sessions_total)},
        {'label': 'Début checkout',   'count': begin_checkouts, 'pct': pct(begin_checkouts, sessions_total)},
        {'label': 'Achats',           'count': purchases,       'pct': pct(purchases,       sessions_total)},
    ]

    # ── 3. Top communes ───────────────────────────────────────────────────────
    top_cities = (
        AnalyticsSession.objects
        .filter(first_seen__gte=since, city__gt='')
        .values('city', 'region', 'country')
        .annotate(sessions=Count('id'))
        .order_by('-sessions')[:15]
    )
    cities_data = list(top_cities)

    # CA par ville via les commandes (via les événements purchase liés aux sessions)
    city_revenue = {}
    purchase_events = (
        AnalyticsEvent.objects
        .filter(event_type='purchase', timestamp__gte=since, order_oid__gt='')
        .select_related('session')
        .values('order_oid', 'session__city')
    )
    order_totals = {o['oid']: float(o['total']) for o in Order.objects.filter(status='paid').values('oid', 'total')}
    for ev in purchase_events:
        city = ev['session__city'] or ''
        if city:
            city_revenue[city] = city_revenue.get(city, 0) + order_totals.get(ev['order_oid'], 0)
    for c in cities_data:
        c['revenue'] = round(city_revenue.get(c['city'], 0), 2)

    # ── 4. Top produits (vues + achats) ──────────────────────────────────────
    top_viewed = (
        AnalyticsEvent.objects
        .filter(event_type='product_view', timestamp__gte=since, product_name__gt='')
        .values('product_name', 'universe')
        .annotate(views=Count('id'))
        .order_by('-views')[:8]
    )
    top_sold = (
        AnalyticsEvent.objects
        .filter(event_type='purchase', timestamp__gte=since)
        .values('order_oid')
        .distinct()
    )
    # CA par produit depuis OrderItem
    from django.db.models import Sum as S
    top_products_revenue = (
        OrderItem.objects
        .filter(order__status='paid', order__date__gte=since)
        .values('product_name')
        .annotate(revenue=S('product_price') * S('quantity'), qty=Count('id'))
        .order_by('-revenue')[:8]
    )

    # ── 5. Sources UTM ────────────────────────────────────────────────────────
    # Par source
    utm_sources = (
        AnalyticsSession.objects
        .filter(first_seen__gte=since)
        .values('utm_source')
        .annotate(sessions=Count('id'))
        .order_by('-sessions')
    )
    utm_orders = (
        Order.objects
        .filter(status='paid', date__gte=since, utm_source__gt='')
        .values('utm_source')
        .annotate(orders=Count('id'), revenue=Sum('total'))
    )
    utm_order_map = {u['utm_source']: {'orders': u['orders'], 'revenue': float(u['revenue'])} for u in utm_orders}
    utm_data = []
    for s in utm_sources:
        src = s['utm_source'] or 'direct'
        extra = utm_order_map.get(src, {'orders': 0, 'revenue': 0})
        utm_data.append({'source': src, 'sessions': s['sessions'], **extra})

    # Par campagne (détail complet source+medium+campaign)
    utm_campaigns = (
        AnalyticsSession.objects
        .filter(first_seen__gte=since, utm_campaign__gt='')
        .values('utm_source', 'utm_medium', 'utm_campaign', 'utm_content')
        .annotate(sessions=Count('id'))
        .order_by('-sessions')[:20]
    )
    campaign_orders = (
        Order.objects
        .filter(status='paid', date__gte=since, utm_campaign__gt='')
        .values('utm_source', 'utm_medium', 'utm_campaign')
        .annotate(orders=Count('id'), revenue=Sum('total'))
    )
    camp_order_map = {
        (u['utm_source'], u['utm_campaign']): {'orders': u['orders'], 'revenue': float(u['revenue'])}
        for u in campaign_orders
    }
    utm_campaigns_data = []
    for c in utm_campaigns:
        key = (c['utm_source'], c['utm_campaign'])
        extra = camp_order_map.get(key, {'orders': 0, 'revenue': 0})
        utm_campaigns_data.append({
            'source':   c['utm_source']   or '',
            'medium':   c['utm_medium']   or '',
            'campaign': c['utm_campaign'] or '',
            'content':  c['utm_content']  or '',
            'sessions': c['sessions'],
            **extra,
        })

    # ── 6. Appareils ──────────────────────────────────────────────────────────
    devices = (
        AnalyticsSession.objects
        .filter(first_seen__gte=since, device_type__gt='')
        .values('device_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # ── 7. KPIs globaux ───────────────────────────────────────────────────────
    total_revenue = Order.objects.filter(status='paid', date__gte=since).aggregate(r=Sum('total'))['r'] or 0
    avg_order     = Order.objects.filter(status='paid', date__gte=since).aggregate(a=Avg('total'))['a'] or 0
    new_customers = Order.objects.filter(status='paid', date__gte=since).values('email').distinct().count()

    return Response({
        'period_days':       days,
        'kpis': {
            'sessions':      sessions_total,
            'revenue':       float(total_revenue),
            'avg_order':     float(avg_order),
            'new_customers': new_customers,
            'purchases':     purchases,
            'conversion_rate': pct(purchases, sessions_total),
        },
        'revenue_chart':     revenue_chart,
        'funnel':            funnel,
        'top_cities':        cities_data,
        'utm_sources':       utm_data,
        'utm_campaigns':     utm_campaigns_data,
        'top_viewed':        list(top_viewed),
        'top_products':      list(top_products_revenue),
        'devices':           list(devices),
    })


# ── Sitemap XML dynamique ─────────────────────────────────────────────────────
def sitemap_xml(request):
    from django.conf import settings as dj_settings
    site_url = getattr(dj_settings, 'FRONTEND_URL', 'https://ethnispirit.fr').rstrip('/')

    # Pages statiques
    static_urls = [
        ('/',             '1.0',  'weekly'),
        ('/catalogue',    '0.9',  'daily'),
        ('/bio',          '0.9',  'weekly'),
        ('/bio/catalogue','0.85', 'daily'),
        ('/a-propos',     '0.6',  'monthly'),
        ('/contact',      '0.6',  'monthly'),
        ('/faq',          '0.5',  'monthly'),
        ('/livraison',    '0.5',  'monthly'),
        ('/politique',    '0.4',  'monthly'),
    ]

    # Produits actifs
    products = Product.objects.filter(is_active=True).only('slug', 'date')

    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    for path, priority, changefreq in static_urls:
        lines.append(f'''  <url>
    <loc>{site_url}{path}</loc>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>''')

    for p in products:
        lastmod = p.date.strftime('%Y-%m-%d') if p.date else ''
        # Mode antillaise
        lines.append(f'''  <url>
    <loc>{site_url}/produit/{p.slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>''')
        # Bio (même slug, chemin /bio/)
        lines.append(f'''  <url>
    <loc>{site_url}/bio/produit/{p.slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>''')

    lines.append('</urlset>')
    return HttpResponse('\n'.join(lines), content_type='application/xml; charset=utf-8')


# ── Modal de bienvenue — GET public ──────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def welcome_promo_settings(request):
    """Retourne les paramètres du modal de bienvenue (public)."""
    s = WelcomePromoSettings.get_settings()
    return Response({
        'is_active':     s.is_active,
        'universe':      s.universe,
        'title':         s.title,
        'subtitle':      s.subtitle,
        'promo_code':    s.promo_code,
        'discount_text': s.discount_text,
        'body_text':     s.body_text,
        'delay_seconds': s.delay_seconds,
    })


# ── Modal de bienvenue — PATCH admin ─────────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_welcome_promo_update(request):
    """Met à jour les paramètres du modal de bienvenue (admin seulement)."""
    s = WelcomePromoSettings.get_settings()
    allowed = ['is_active', 'universe', 'title', 'subtitle', 'promo_code',
               'discount_text', 'body_text', 'delay_seconds']
    for field in allowed:
        if field in request.data:
            setattr(s, field, request.data[field])
    s.save()
    return Response({
        'is_active':     s.is_active,
        'universe':      s.universe,
        'title':         s.title,
        'subtitle':      s.subtitle,
        'promo_code':    s.promo_code,
        'discount_text': s.discount_text,
        'body_text':     s.body_text,
        'delay_seconds': s.delay_seconds,
    })


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS INTERNES
# ══════════════════════════════════════════════════════════════════════════════

def _check_stock_alert(product_id):
    """
    Vérifie si le stock d'un produit est en dessous du seuil configuré
    et envoie un email d'alerte si nécessaire.
    """
    from django.conf import settings as dj_settings
    from django.core.mail import send_mail

    try:
        alert_settings = StockAlertSettings.get_settings()
        if not alert_settings.is_active or not alert_settings.email:
            return
        product = Product.objects.get(id=product_id)
        if product.stock < alert_settings.threshold:
            send_mail(
                subject=f'[EthniSpirit] Alerte stock bas — {product.name}',
                message=(
                    f'Bonjour,\n\n'
                    f'Le stock du produit "{product.name}" est bas.\n\n'
                    f'Stock actuel : {product.stock} unité(s)\n'
                    f'Seuil d\'alerte : {alert_settings.threshold} unité(s)\n\n'
                    f'Connectez-vous à l\'administration pour réapprovisionner :\n'
                    f'{getattr(dj_settings, "FRONTEND_URL", "")}/admin\n\n'
                    f'— EthniSpirit'
                ),
                from_email=dj_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[alert_settings.email],
                fail_silently=True,
            )
    except Exception:
        pass


def _send_order_confirmation_email(order):
    """
    Envoie un email de confirmation de commande avec récap et lien de suivi.
    """
    from django.conf import settings as dj_settings
    from django.core.mail import send_mail

    try:
        frontend_url = getattr(dj_settings, 'FRONTEND_URL', 'https://ethnispirit.fr').rstrip('/')
        tracking_url = f'{frontend_url}/suivi-commande?oid={order.oid}&email={order.email}'

        items_lines = '\n'.join(
            f'  - {item.product_name} × {item.quantity}  ({item.product_price} €)'
            for item in order.items.all()
        )

        message = (
            f'Bonjour {order.full_name},\n\n'
            f'Votre commande a bien été reçue et votre paiement confirmé. Merci pour votre achat !\n\n'
            f'──────────────────────────────────────\n'
            f'Numéro de commande : {order.oid}\n'
            f'──────────────────────────────────────\n\n'
            f'Articles commandés :\n{items_lines}\n\n'
            f'Frais de livraison : {order.shipping_cost} €\n'
            f'Total payé         : {order.total} €\n\n'
            f'Adresse de livraison :\n'
            f'  {order.full_name}\n'
            f'  {order.address}\n'
            f'  {order.postal_code} {order.city}, {order.country}\n\n'
            f'Suivez votre commande en temps réel :\n{tracking_url}\n\n'
            f'À bientôt,\nL\'équipe EthniSpirit\ncontact@ethnispirit.fr'
        )

        send_mail(
            subject=f'Confirmation de votre commande EthniSpirit — {order.oid}',
            message=message,
            from_email=dj_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            fail_silently=True,
        )
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════════════════════
# 1. PRODUITS SIMILAIRES
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def product_related(request, slug):
    """
    GET /api/products/<slug>/related/
    Retourne 4 produits actifs de la même catégorie (hors produit courant).
    Fallback sur le même univers si moins de 4.
    """
    try:
        product = Product.objects.select_related('category').get(slug=slug, is_active=True)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    related = list(
        Product.objects.filter(
            is_active=True,
            category=product.category,
        ).exclude(id=product.id).select_related('category')[:4]
    )

    if len(related) < 4 and product.category:
        universe = product.category.universe
        existing_ids = [p.id for p in related] + [product.id]
        needed = 4 - len(related)
        fallback = list(
            Product.objects.filter(
                is_active=True,
                category__universe=universe,
            ).exclude(id__in=existing_ids).select_related('category')[:needed]
        )
        related.extend(fallback)

    serializer = ProductListSerializer(related, many=True, context={'request': request})
    return Response(serializer.data)


# ══════════════════════════════════════════════════════════════════════════════
# 2. EXPORT COMMANDES CSV
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_orders_export_csv(request):
    """
    GET /api/admin/orders/export-csv/
    Retourne un fichier CSV de toutes les commandes.
    """
    import csv

    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = 'attachment; filename=commandes.csv'

    writer = csv.writer(response, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        'oid', 'date', 'full_name', 'email', 'phone',
        'address', 'city', 'country', 'status',
        'total', 'shipping_cost', 'promo_code_used', 'items',
    ])

    qs = Order.objects.prefetch_related(
        'items', 'promo_code', 'promo_code_mode', 'promo_code_bio'
    ).order_by('-date')

    for order in qs:
        # Codes promo utilisés
        promo_parts = []
        if order.promo_code:
            promo_parts.append(order.promo_code.code)
        if order.promo_code_mode and (not order.promo_code or order.promo_code_mode_id != order.promo_code_id):
            promo_parts.append(order.promo_code_mode.code)
        if order.promo_code_bio:
            promo_parts.append(order.promo_code_bio.code)
        promo_str = ' | '.join(promo_parts) if promo_parts else ''

        # Articles
        items_str = ' | '.join(
            f'{item.product_name} x{item.quantity}'
            for item in order.items.all()
        )

        writer.writerow([
            order.oid,
            order.date.strftime('%Y-%m-%d %H:%M') if order.date else '',
            order.full_name,
            order.email,
            order.phone,
            order.address,
            order.city,
            order.country,
            order.status,
            str(order.total),
            str(order.shipping_cost),
            promo_str,
            items_str,
        ])

    return response


# ══════════════════════════════════════════════════════════════════════════════
# 3. SUIVI COMMANDE (PUBLIC)
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def order_track(request):
    """
    GET /api/orders/track/?oid=X&email=Y
    Retourne le statut + items + date si OID et email correspondent.
    """
    oid   = request.query_params.get('oid', '').strip()
    email = request.query_params.get('email', '').strip().lower()

    if not oid or not email:
        return Response({'error': 'oid et email requis.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.prefetch_related('items').get(
            oid=oid,
            email__iexact=email,
        )
    except Order.DoesNotExist:
        return Response({'error': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    items_data = [
        {
            'product_name':  item.product_name,
            'product_price': str(item.product_price),
            'quantity':      item.quantity,
            'subtotal':      str(item.subtotal),
        }
        for item in order.items.all()
    ]

    return Response({
        'oid':           order.oid,
        'status':        order.status,
        'status_label':  order.get_status_display(),
        'date':          order.date,
        'total':         str(order.total),
        'shipping_cost': str(order.shipping_cost),
        'full_name':     order.full_name,
        'city':          order.city,
        'country':       order.country,
        'items':         items_data,
    })


# ══════════════════════════════════════════════════════════════════════════════
# 4. ALERTES STOCK BAS
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminUser])
def admin_stock_alerts(request):
    """
    GET  /api/admin/stock-alerts/ — settings + produits sous seuil
    PATCH /api/admin/stock-alerts/ — met à jour threshold/email/is_active
    """
    alert_settings = StockAlertSettings.get_settings()

    if request.method == 'PATCH':
        for field in ('threshold', 'email', 'is_active'):
            if field in request.data:
                val = request.data[field]
                if field == 'threshold':
                    try:
                        val = int(val)
                    except (TypeError, ValueError):
                        return Response({'error': 'threshold doit être un entier.'}, status=status.HTTP_400_BAD_REQUEST)
                elif field == 'is_active':
                    if isinstance(val, str):
                        val = val.lower() == 'true'
                setattr(alert_settings, field, val)
        alert_settings.save()

    low_stock = Product.objects.filter(
        is_active=True,
        stock__lt=alert_settings.threshold,
    ).select_related('category').order_by('stock')

    products_data = [
        {
            'id':       p.id,
            'name':     p.name,
            'slug':     p.slug,
            'stock':    p.stock,
            'category': p.category.name if p.category else None,
        }
        for p in low_stock
    ]

    return Response({
        'settings': {
            'threshold': alert_settings.threshold,
            'email':     alert_settings.email,
            'is_active': alert_settings.is_active,
        },
        'low_stock_products': products_data,
        'low_stock_count':    len(products_data),
    })


# ══════════════════════════════════════════════════════════════════════════════
# 5. NOTIFICATIONS RUPTURE DE STOCK
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def notify_restock(request, slug):
    """
    POST /api/products/<slug>/notify-restock/
    Crée ou met à jour une notification de réapprovisionnement.
    """
    try:
        product = Product.objects.get(slug=slug)
    except Product.DoesNotExist:
        return Response({'error': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    email = request.data.get('email', '').strip()
    phone = request.data.get('phone', '').strip()

    if not email:
        return Response({'error': 'email requis.'}, status=status.HTTP_400_BAD_REQUEST)

    obj, created = RestockNotification.objects.update_or_create(
        product=product,
        email=email,
        defaults={'phone': phone, 'notified': False},
    )

    return Response(
        {'message': 'Nous vous préviendrons dès que ce produit sera disponible.'},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_restock_notifications(request):
    """
    GET /api/admin/restock-notifications/
    Liste des notifications de réapprovisionnement pour l'admin.
    """
    qs = RestockNotification.objects.select_related('product').order_by('-created_at')

    # Filtre optionnel par produit ou statut
    product_slug = request.query_params.get('product')
    if product_slug:
        qs = qs.filter(product__slug=product_slug)

    notified_filter = request.query_params.get('notified')
    if notified_filter is not None:
        qs = qs.filter(notified=notified_filter.lower() == 'true')

    data = [
        {
            'id':            n.id,
            'product_id':    n.product_id,
            'product_name':  n.product.name,
            'product_slug':  n.product.slug,
            'product_stock': n.product.stock,
            'email':         n.email,
            'phone':         n.phone,
            'notified':      n.notified,
            'created_at':    n.created_at,
        }
        for n in qs
    ]
    return Response(data)


# ══════════════════════════════════════════════════════════════════════════════
# 7. PANIER ABANDONNÉ — endpoint email
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['PATCH'])
@permission_classes([AllowAny])
def cart_update_email(request):
    """
    PATCH /api/cart/email/
    Reçoit cart_id + email, met à jour Cart et enregistre checkout_started_at.
    """
    from django.utils import timezone as tz

    cart_id = request.data.get('cart_id', '').strip()
    email   = request.data.get('email', '').strip()

    if not cart_id or not email:
        return Response({'error': 'cart_id et email requis.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cart = Cart.objects.get(cart_id=cart_id)
    except Cart.DoesNotExist:
        return Response({'error': 'Panier introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    cart.email = email
    if not cart.checkout_started_at:
        cart.checkout_started_at = tz.now()
    cart.save(update_fields=['email', 'checkout_started_at'])

    return Response({'message': 'Email enregistré.'})
