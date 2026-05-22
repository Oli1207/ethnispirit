import { create } from 'zustand';
import { cartAPI } from '../utils/api';
import { trackEventStandalone } from '../hooks/useTracking';

const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,
  error: null,

  // ── Nombre total d'articles ────────────────────────────────────────────────
  get itemCount() {
    const cart = get().cart;
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // ── Charger le panier ─────────────────────────────────────────────────────
  fetchCart: () => {
    set({ loading: true, error: null });
    cartAPI.get()
      .then(({ data }) => set({ cart: data, loading: false }))
      .catch(() => set({ loading: false, error: 'Impossible de charger le panier.' }));
  },

  // ── Ajouter un article ────────────────────────────────────────────────────
  addItem: (productId, quantity = 1, productMeta = {}) => {
    set({ loading: true });
    return cartAPI.add(productId, quantity)
      .then(({ data }) => {
        set({ cart: data, loading: false });
        trackEventStandalone('add_to_cart', {
          product_id:   productId,
          product_name: productMeta.name || '',
          universe:     productMeta.universe || '',
          value:        productMeta.price ? parseFloat(productMeta.price) * quantity : undefined,
        });
        return { success: true };
      })
      .catch(() => {
        set({ loading: false });
        return { success: false };
      });
  },

  // ── Mettre à jour la quantité ─────────────────────────────────────────────
  updateItem: (itemId, quantity) => {
    cartAPI.update(itemId, quantity)
      .then(({ data }) => set({ cart: data }))
      .catch(() => {});
  },

  // ── Supprimer un article ──────────────────────────────────────────────────
  removeItem: (itemId, productMeta = {}) => {
    cartAPI.remove(itemId)
      .then(({ data }) => {
        set({ cart: data });
        trackEventStandalone('remove_from_cart', {
          product_id:   productMeta.id || '',
          product_name: productMeta.name || '',
        });
      })
      .catch(() => {});
  },

  // ── Vider le panier localement (après commande) ───────────────────────────
  clearCart: () => set({ cart: null }),
}));

export default useCartStore;
