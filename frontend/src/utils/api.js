import axiosInstance from './axios';
import { CART_ID_KEY } from './constants';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCartId() {
  let id = localStorage.getItem(CART_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CART_ID_KEY, id);
  }
  return id;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => axiosInstance.post('/api/auth/token/', data),
  refresh:        (data) => axiosInstance.post('/api/auth/token/refresh/', data),
  register:       (data) => axiosInstance.post('/api/auth/register/', data),
  me:             ()     => axiosInstance.get('/api/auth/me/'),
  updateProfile:  (data) => axiosInstance.patch('/api/auth/me/update/', data),
  changePassword: (data) => axiosInstance.post('/api/auth/me/password/', data),
  forgotPassword: (data) => axiosInstance.post('/api/auth/forgot-password/', data),
  resetPassword:  (data) => axiosInstance.post('/api/auth/reset-password/', data),
};

// ── Catégories ────────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list: (universe) => axiosInstance.get('/api/categories/', { params: universe ? { universe } : {} }),
};

// ── Produits ──────────────────────────────────────────────────────────────────
export const productsAPI = {
  list:          (params = {}) => axiosInstance.get('/api/products/', { params }),
  detail:        (slug)        => axiosInstance.get(`/api/products/${slug}/`),
  related:       (slug)        => axiosInstance.get(`/api/products/${slug}/related/`),
  notifyRestock: (slug, data)  => axiosInstance.post(`/api/products/${slug}/notify-restock/`, data),
};

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const wishlistAPI = {
  list:   ()            => axiosInstance.get('/api/wishlist/'),
  toggle: (productId)   => axiosInstance.post(`/api/wishlist/${productId}/`),
};

// ── Panier ────────────────────────────────────────────────────────────────────
export const cartAPI = {
  get: () =>
    axiosInstance.get('/api/cart/', { params: { cart_id: getCartId() } }),

  add: (productId, quantity = 1) =>
    axiosInstance.post('/api/cart/add/', {
      cart_id: getCartId(),
      product_id: productId,
      quantity,
    }),

  update: (itemId, quantity) =>
    axiosInstance.patch(`/api/cart/item/${itemId}/`, { quantity, cart_id: getCartId() }),

  remove: (itemId) =>
    axiosInstance.delete(`/api/cart/item/${itemId}/remove/`, { params: { cart_id: getCartId() } }),

  saveEmail: (email) =>
    axiosInstance.patch('/api/cart/email/', { cart_id: getCartId(), email }),
};

// ── Code promo ────────────────────────────────────────────────────────────────
export const promoAPI = {
  // mode_subtotal / bio_subtotal : sous-totaux par univers pour calcul contextuel
  check: (code, modeSubtotal = 0, bioSubtotal = 0) =>
    axiosInstance.post('/api/promo/check/', {
      code,
      mode_subtotal: modeSubtotal,
      bio_subtotal:  bioSubtotal,
    }),
};

// ── Commandes ─────────────────────────────────────────────────────────────────
export const ordersAPI = {
  list:   ()      => axiosInstance.get('/api/orders/'),
  detail: (oid)   => axiosInstance.get(`/api/orders/${oid}/`),
  create: (data)  => axiosInstance.post('/api/orders/create/', {
    ...data,
    cart_id: getCartId(),
  }),
  verify: (oid, sessionId) => axiosInstance.post(`/api/orders/${oid}/verify/`, { session_id: sessionId }),
};

// ── Avis produit ─────────────────────────────────────────────────────────────
export const reviewsAPI = {
  list:   (slug)         => axiosInstance.get(`/api/products/${slug}/reviews/`),
  create: (slug, data)   => axiosInstance.post(`/api/products/${slug}/reviews/create/`, data),
  delete: (slug)         => axiosInstance.delete(`/api/products/${slug}/reviews/delete/`),
};

// ── Contact ───────────────────────────────────────────────────────────────────
export const contactAPI = {
  send: (data) => axiosInstance.post('/api/contact/', data),
};

// ── Demande de produit ────────────────────────────────────────────────────────
export const productRequestAPI = {
  send: (formData) => axiosInstance.post('/api/product-request/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Newsletter ────────────────────────────────────────────────────────────────
export const newsletterAPI = {
  subscribe: (email, universe = 'mode') =>
    axiosInstance.post('/api/newsletter/subscribe/', { email, universe }),
};

// ── Livraison ─────────────────────────────────────────────────────────────────
export const shippingAPI = {
  quote: (destination, subtotal) =>
    axiosInstance.get('/api/shipping/quote/', { params: { destination, subtotal } }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => axiosInstance.get('/api/admin/stats/'),

  // Produits
  products:      (search = '') => axiosInstance.get('/api/admin/products/', { params: search ? { search } : {} }),
  createProduct: (fd)          => axiosInstance.post('/api/admin/products/create/', fd),
  updateProduct: (id, fd)      => axiosInstance.patch(`/api/admin/products/${id}/update/`, fd),
  deleteProduct: (id)          => axiosInstance.delete(`/api/admin/products/${id}/delete/`),
  deleteImage:   (imgId)       => axiosInstance.delete(`/api/admin/products/images/${imgId}/delete/`),

  // Catégories
  createCategory: (fd)         => axiosInstance.post('/api/admin/categories/create/', fd),
  updateCategory: (id, fd)     => axiosInstance.patch(`/api/admin/categories/${id}/update/`, fd),
  deleteCategory: (id)         => axiosInstance.delete(`/api/admin/categories/${id}/delete/`),

  // Alertes stock
  stockAlerts:       ()     => axiosInstance.get('/api/admin/stock-alerts/'),
  updateStockAlerts: (data) => axiosInstance.patch('/api/admin/stock-alerts/', data),

  // Notifications de réapprovisionnement
  restockNotifications: () => axiosInstance.get('/api/admin/restock-notifications/'),

  // Export CSV commandes
  exportOrders: () => axiosInstance.get('/api/admin/orders/export-csv/', { responseType: 'blob' }),
};
