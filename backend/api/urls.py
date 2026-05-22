from django.urls import path
from . import views

urlpatterns = [
    # Catégories
    path('categories/',                   views.categories_list,        name='categories_list'),

    # Produits
    path('products/',                                  views.products_list,          name='products_list'),
    path('products/<slug:slug>/',                      views.product_detail,         name='product_detail'),
    path('products/<slug:slug>/related/',              views.product_related,        name='product_related'),
    path('products/<slug:slug>/reviews/',              views.product_reviews_list,   name='product_reviews_list'),
    path('products/<slug:slug>/reviews/create/',       views.product_review_create,  name='product_review_create'),
    path('products/<slug:slug>/reviews/delete/',       views.product_review_delete,  name='product_review_delete'),
    path('products/<slug:slug>/notify-restock/',       views.notify_restock,         name='notify_restock'),

    # Wishlist
    path('wishlist/',                     views.wishlist_list,          name='wishlist_list'),
    path('wishlist/<int:product_id>/',    views.wishlist_toggle,        name='wishlist_toggle'),

    # Panier
    path('cart/',                           views.cart_detail,          name='cart_detail'),
    path('cart/add/',                       views.cart_add,             name='cart_add'),
    path('cart/email/',                     views.cart_update_email,    name='cart_update_email'),
    path('cart/item/<int:item_id>/',        views.cart_update,          name='cart_update'),
    path('cart/item/<int:item_id>/remove/', views.cart_remove,          name='cart_remove'),

    # Code promo
    path('promo/check/',                  views.promo_check,            name='promo_check'),

    # Livraison
    path('shipping/quote/',               views.shipping_quote,         name='shipping_quote'),

    # Commandes
    path('orders/',                       views.orders_list,            name='orders_list'),
    path('orders/create/',                views.order_create,           name='order_create'),
    path('orders/track/',                 views.order_track,            name='order_track'),
    path('orders/<str:oid>/',             views.order_detail,           name='order_detail'),
    path('orders/<str:oid>/verify/',      views.order_payment_verify,   name='order_payment_verify'),

    # Contact
    path('contact/',                      views.contact_send,            name='contact_send'),
    path('admin/contacts/',               views.admin_contacts_list,     name='admin_contacts_list'),
    path('admin/contacts/<int:msg_id>/read/', views.admin_contact_mark_read, name='admin_contact_mark_read'),
    path('admin/contacts/<int:msg_id>/delete/', views.admin_contact_delete, name='admin_contact_delete'),

    # Newsletter
    path('newsletter/subscribe/',         views.newsletter_subscribe,    name='newsletter_subscribe'),
    path('newsletter/subscribers/',       views.newsletter_subscribers,  name='newsletter_subscribers'),

    # Admin — stats & commandes
    path('admin/stats/',                              views.admin_stats,                  name='admin_stats'),
    path('admin/orders/',                             views.admin_orders_list,            name='admin_orders_list'),
    path('admin/orders/export-csv/',                  views.admin_orders_export_csv,      name='admin_orders_export_csv'),
    path('admin/orders/<str:oid>/',                   views.admin_order_detail,           name='admin_order_detail'),
    path('orders/<str:oid>/status/',                  views.order_update_status,          name='order_update_status'),
    path('admin/stock-alerts/',                       views.admin_stock_alerts,           name='admin_stock_alerts'),
    path('admin/restock-notifications/',              views.admin_restock_notifications,  name='admin_restock_notifications'),

    # Admin — Codes promo
    path('admin/promo/',                              views.admin_promo_list,             name='admin_promo_list'),
    path('admin/promo/create/',                       views.admin_promo_create,           name='admin_promo_create'),
    path('admin/promo/<int:promo_id>/update/',        views.admin_promo_update,           name='admin_promo_update'),
    path('admin/promo/<int:promo_id>/delete/',        views.admin_promo_delete,           name='admin_promo_delete'),

    # Admin — CRUD Produits
    path('admin/products/',                           views.admin_products_list,          name='admin_products_list'),
    path('admin/products/create/',                    views.admin_product_create,         name='admin_product_create'),
    path('admin/products/<int:product_id>/update/',   views.admin_product_update,         name='admin_product_update'),
    path('admin/products/<int:product_id>/delete/',   views.admin_product_delete,         name='admin_product_delete'),
    path('admin/products/images/<int:image_id>/delete/', views.admin_product_image_delete, name='admin_product_image_delete'),

    # Admin — CRUD Catégories
    path('admin/categories/create/',                  views.admin_category_create,        name='admin_category_create'),
    path('admin/categories/<int:category_id>/update/', views.admin_category_update,       name='admin_category_update'),
    path('admin/categories/<int:category_id>/delete/', views.admin_category_delete,       name='admin_category_delete'),

    # Tracking
    path('track/session/',               views.track_session,           name='track_session'),
    path('track/event/',                 views.track_event,             name='track_event'),

    # Admin — Analytics
    path('admin/analytics/',             views.admin_analytics,         name='admin_analytics'),

    # Modal de bienvenue
    path('welcome-promo/',               views.welcome_promo_settings,       name='welcome_promo_settings'),
    path('admin/welcome-promo/',         views.admin_welcome_promo_update,   name='admin_welcome_promo_update'),

    # Admin — Zones de livraison
    path('admin/shipping/',                           views.admin_shipping_list,          name='admin_shipping_list'),
    path('admin/shipping/create/',                    views.admin_shipping_create,        name='admin_shipping_create'),
    path('admin/shipping/<int:zone_id>/update/',      views.admin_shipping_update,        name='admin_shipping_update'),
    path('admin/shipping/<int:zone_id>/delete/',      views.admin_shipping_delete,        name='admin_shipping_delete'),
]
