/**
 * Système RBAC frontend — EthniSpirit
 * Correspond exactement aux valeurs du backend (api/models.py ROLE_DEFAULT_PERMISSIONS)
 */

export const ALL_PERMISSIONS = [
  'orders_view',
  'orders_manage',
  'orders_status_only',
  'products_view',
  'products_manage',
  'categories_manage',
  'promo_manage',
  'customers_view',
  'analytics_view',
  'reviews_manage',
  'messages_view',
  'staff_manage',
];

export const PERMISSION_LABELS = {
  orders_view:         'Voir les commandes',
  orders_manage:       'Gérer les commandes',
  orders_status_only:  'Modifier statut uniquement',
  products_view:       'Voir les produits',
  products_manage:     'Gérer les produits',
  categories_manage:   'Gérer les catégories',
  promo_manage:        'Gérer les codes promo',
  customers_view:      'Voir les clients',
  analytics_view:      'Voir les analytics',
  reviews_manage:      'Gérer les avis',
  messages_view:       'Voir les messages',
  staff_manage:        'Gérer l\'équipe',
};

export const ROLE_LABELS = {
  delivery:   'Livraison',
  catalog:    'Catalogue',
  support:    'Service client',
  accounting: 'Comptabilité',
  superadmin: 'Super Admin',
};

export const ROLE_DEFAULT_PERMISSIONS = {
  delivery: {
    orders_view: true,
    orders_manage: true,
    orders_status_only: true,
  },
  catalog: {
    products_view: true,
    products_manage: true,
    categories_manage: true,
  },
  support: {
    orders_view: true,
    products_view: true,
    customers_view: true,
    reviews_manage: true,
    messages_view: true,
  },
  accounting: {
    orders_view: true,
    products_view: true,
    customers_view: true,
    analytics_view: true,
  },
  superadmin: {
    orders_view: true,
    orders_manage: true,
    orders_status_only: true,
    products_view: true,
    products_manage: true,
    categories_manage: true,
    promo_manage: true,
    customers_view: true,
    analytics_view: true,
    reviews_manage: true,
    messages_view: true,
    staff_manage: true,
  },
};

/**
 * Vérifie si un user a une permission donnée.
 * @param {object} user — objet user du store (doit inclure staff_profile ou is_superuser)
 * @param {string} perm — nom de la permission
 */
export function hasPermission(user, perm) {
  if (!user) return false;

  // Superadmin Django ou rôle superadmin → accès total
  if (user.is_superuser) return true;
  const sp = user.staff_profile;
  if (sp?.role === 'superadmin' && sp?.is_active) return true;

  if (!sp || !sp.is_active) return false;

  // Utiliser effective_permissions renvoyé par le backend si disponible
  if (sp.effective_permissions) {
    return Boolean(sp.effective_permissions[perm]);
  }

  // Fallback local : rôle par défaut + extra_permissions
  const base  = ROLE_DEFAULT_PERMISSIONS[sp.role] || {};
  const extra = sp.extra_permissions || {};
  return Boolean({ ...base, ...extra }[perm]);
}

/**
 * Retourne true si l'utilisateur a accès à au moins un panneau admin.
 */
export function isAdminUser(user) {
  if (!user) return false;
  return user.is_staff || user.is_superuser;
}
