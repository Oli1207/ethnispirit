import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import useCartStore from '../../store/cart';

export default function WishlistScreen() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    wishlistAPI.list()
      .then(({ data }) => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleRemove(productId) {
    wishlistAPI.toggle(productId)
      .then(() => setItems((prev) => prev.filter((i) => i.product.id !== productId)))
      .catch(() => {});
  }

  return (
    <div style={{ background: 'var(--cream)' }}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Espace personnel</p>
            <h1 className="eth-section-title">Mes <em>favoris</em></h1>
            {!loading && (
              <p className="eth-section-sub mt-1">
                {items.length} article{items.length !== 1 ? 's' : ''} sauvegardé{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="eth-page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="eth-empty-state" style={{ maxWidth: 420, margin: '60px auto', textAlign: 'center' }}>
            <div className="eth-empty-icon">
              <i className="fa-regular fa-heart"></i>
            </div>
            <h5 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--text-dark)', marginBottom: 10 }}>
              Aucun favori pour l'instant
            </h5>
            <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 28 }}>
              Ajoutez des articles à vos favoris depuis les fiches produits pour les retrouver ici.
            </p>
            <Link to="/catalogue" className="btn-eth-primary" style={{ padding: '12px 28px' }}>
              <i className="fa-solid fa-arrow-right me-2"></i>Explorer le catalogue
            </Link>
          </div>
        ) : (
          <div className="eth-wishlist-grid">
            {items.map((item) => (
              <div className="eth-product-card" key={item.id}>
                <Link to={`/produit/${item.product.slug}`}>
                  <div className="eth-product-img-wrap">
                    {item.product.main_image ? (
                      <img
                        src={item.product.main_image}
                        alt={item.product.name}
                        className="eth-product-img"
                      />
                    ) : (
                      <div className="eth-product-img-placeholder">
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  className="eth-wishlist-remove-btn"
                  onClick={() => handleRemove(item.product.id)}
                  title="Retirer des favoris"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="eth-product-body">
                  <p className="eth-product-cat">{item.product.category_name}</p>
                  <h6 className="eth-product-name">
                    <Link to={`/produit/${item.product.slug}`}>{item.product.name}</Link>
                  </h6>
                  <div className="eth-product-footer">
                    <span className="eth-product-price">{formatPrice(item.product.price)}</span>
                    <button
                      className="eth-btn-cart"
                      onClick={() => addItem(item.product.id, 1)}
                      disabled={item.product.stock === 0}
                      title={item.product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    >
                      {item.product.stock === 0
                        ? <i className="fa-solid fa-ban"></i>
                        : <i className="fa-solid fa-bag-shopping"></i>
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
