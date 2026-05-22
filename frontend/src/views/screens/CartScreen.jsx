import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/currency';
import { promoAPI } from '../../utils/api';
import useCartStore from '../../store/cart';
import { getStoredCoupon, clearStoredCoupon } from '../../hooks/useTracking';

// Bannière de notification temporaire (succès ou erreur)
function AutoPromoNotice({ type, message, onDismiss }) {
  const isOk = type === 'success';
  return (
    <div style={{
      background: isOk ? 'rgba(45,90,46,.1)' : 'rgba(220,53,69,.07)',
      border: `1px solid ${isOk ? 'rgba(45,90,46,.3)' : 'rgba(220,53,69,.25)'}`,
      borderRadius: 'var(--r-sm)', padding: '10px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13,
      marginBottom: 10,
    }}>
      <i
        className={`fa-solid ${isOk ? 'fa-circle-check' : 'fa-circle-exclamation'}`}
        style={{ color: isOk ? 'var(--bio-main)' : '#dc3545', flexShrink: 0, marginTop: 1 }}
      />
      <span style={{ color: isOk ? 'var(--bio-main)' : '#dc3545', flex: 1 }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: 0, lineHeight: 1, flexShrink: 0 }}>
        <i className="fa-solid fa-xmark" style={{ fontSize: 11 }}></i>
      </button>
    </div>
  );
}
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

// Libellé d'univers court
function universeLabel(u) {
  if (u === 'mode') return 'Mode';
  if (u === 'bio')  return 'Bio';
  return null; // 'all' → pas de badge
}

export default function CartScreen() {
  const { cart, loading, fetchCart, updateItem, removeItem } = useCartStore();
  const [promoCode, setPromoCode]         = useState('');
  const [promoError, setPromoError]       = useState('');
  const [promoLoading, setPromoLoading]   = useState(false);
  const [appliedPromos, setAppliedPromos] = useState([]); // [{code, universe, discount, ...}]
  const [autoNotice, setAutoNotice]       = useState(null); // {type:'success'|'error', message}
  const navigate = useNavigate();

  useEffect(() => { fetchCart(); }, []);

  // ── Sous-totaux par univers ────────────────────────────────────────────────
  const modeSubtotal = cart?.items?.reduce((acc, item) =>
    item.product.universe === 'mode' ? acc + parseFloat(item.subtotal) : acc, 0) ?? 0;

  const bioSubtotal = cart?.items?.reduce((acc, item) =>
    item.product.universe === 'bio'  ? acc + parseFloat(item.subtotal) : acc, 0) ?? 0;

  // ── Auto-application du coupon stocké (depuis URL ou modal bienvenue) ───────
  useEffect(() => {
    const code = getStoredCoupon();
    if (!code || !cart) return;
    // Ne pas re-appliquer si déjà dans la liste
    if (appliedPromos.some((p) => p.code.toUpperCase() === code.toUpperCase())) {
      clearStoredCoupon();
      return;
    }
    promoAPI.check(code, modeSubtotal, bioSubtotal)
      .then(({ data }) => {
        const check = canAddPromo(data.universe);
        if (!check.ok) {
          setAutoNotice({ type: 'error', message: `Code ${data.code} : ${check.error}` });
          clearStoredCoupon();
          return;
        }
        setAppliedPromos((prev) => [...prev, data]);
        setPromoCode('');
        setAutoNotice({ type: 'success', message: `Code ${data.code} appliqué automatiquement 🎉` });
        clearStoredCoupon();
      })
      .catch((err) => {
        const msg = err.response?.data?.error || `Code ${code} invalide ou expiré.`;
        setAutoNotice({ type: 'error', message: msg });
        clearStoredCoupon();
      });
  }, [cart]); // cart chargé → on tente l'application

  // ── Règles de cumul (vérifiées côté frontend avant l'appel API) ────────────
  function canAddPromo(newUniverse) {
    if (appliedPromos.length >= 2)
      return { ok: false, error: 'Maximum 2 codes promo par commande.' };
    if (appliedPromos.some((p) => p.universe === 'all'))
      return { ok: false, error: 'Un code "tous univers" est déjà appliqué. Il ne peut pas se combiner avec un autre code.' };
    if (newUniverse === 'all' && appliedPromos.length > 0)
      return { ok: false, error: 'Le code universel ne peut pas se combiner avec un autre code.' };
    if (appliedPromos.some((p) => p.universe === newUniverse)) {
      const label = newUniverse === 'mode' ? 'Mode Antillaise' : 'Bio & Naturel';
      return { ok: false, error: `Un code ${label} est déjà appliqué.` };
    }
    return { ok: true };
  }

  async function handlePromoCheck(e) {
    e.preventDefault();
    const trimmed = promoCode.trim().toUpperCase();
    if (!trimmed) return;

    // Déjà appliqué ?
    if (appliedPromos.some((p) => p.code.toUpperCase() === trimmed)) {
      setPromoError('Ce code est déjà appliqué.');
      return;
    }

    setPromoError('');
    setPromoLoading(true);
    try {
      const { data } = await promoAPI.check(trimmed, modeSubtotal, bioSubtotal);
      const check = canAddPromo(data.universe);
      if (!check.ok) {
        setPromoError(check.error);
        return;
      }
      setAppliedPromos((prev) => [...prev, data]);
      setPromoCode('');
      setAutoApplied('');
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Code invalide.');
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo(code) {
    setAppliedPromos((prev) => prev.filter((p) => p.code !== code));
  }

  const subtotal      = parseFloat(cart?.total || 0);
  const totalDiscount = appliedPromos.reduce((acc, p) => acc + parseFloat(p.discount), 0);
  const finalTotal    = Math.max(subtotal - totalDiscount, 0);

  if (loading && !cart) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', background: 'var(--cream)' }}>
        <div className="spinner-border eth-spinner" role="status"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '70vh' }}>
        <SEO title="Mon Panier" description="Votre panier EthniSpirit." noindex={true} />
        <MobileBackButton to="/catalogue" label="Catalogue" />
        <div className="eth-page-header">
          <div className="eth-page-header-inner">
            <div>
              <p className="eth-section-label">Shopping</p>
              <h1 className="eth-section-title">Mon <em>Panier</em></h1>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 36, color: 'var(--text-light)' }}>
            <i className="fa-solid fa-bag-shopping"></i>
          </div>
          <h4 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-dark)', marginBottom: 10 }}>Votre panier est vide</h4>
          <p style={{ color: 'var(--text-light)', maxWidth: 320, marginBottom: 28 }}>Découvrez nos collections et ajoutez des articles à votre panier.</p>
          <Link to="/catalogue" className="btn-eth-primary">
            <i className="fa-solid fa-arrow-right me-2"></i>Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--cream)' }}>
      <SEO title="Mon Panier" description="Finalisez votre commande EthniSpirit — mode antillaise et bio naturel." noindex={true} />
      <MobileBackButton to="/catalogue" label="Continuer mes achats" />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Shopping</p>
            <h1 className="eth-section-title">Mon <em>Panier</em></h1>
            <p className="eth-section-sub mt-1">
              {cart.items.length} article{cart.items.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="eth-page-body">
        <div className="eth-cart-layout">

          {/* Articles */}
          <div className="eth-cart-list">
            {cart.items.map((item) => (
              <div className="eth-cart-item" key={item.id}>
                {item.product.main_image ? (
                  <img src={item.product.main_image} alt={item.product.name} className="eth-cart-item-img" />
                ) : (
                  <div className="eth-cart-item-img" style={{ background: 'var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                    <i className="fa-solid fa-image"></i>
                  </div>
                )}
                <div className="eth-cart-item-info">
                  <Link to={`/produit/${item.product.slug}`} className="eth-cart-item-name">
                    {item.product.name}
                  </Link>
                  <p className="eth-cart-item-price">{formatPrice(item.product.price)} / unité</p>
                </div>
                <div className="eth-qty-selector">
                  <button onClick={() => updateItem(item.id, item.quantity - 1)}>
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <span className="eth-qty-val">{item.quantity}</span>
                  <button onClick={() => updateItem(item.id, item.quantity + 1)}>
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
                <div className="eth-cart-item-sub">{formatPrice(item.subtotal)}</div>
                <button className="eth-btn-remove" onClick={() => removeItem(item.id)} title="Supprimer">
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))}

            <Link to="/catalogue" className="eth-link-back d-flex align-items-center gap-2 mt-2">
              <i className="fa-solid fa-arrow-left"></i>
              Continuer les achats
            </Link>
          </div>

          {/* Récapitulatif */}
          <div className="eth-cart-summary">
            <h5 className="eth-summary-title">Récapitulatif</h5>

            <div className="eth-summary-row">
              <span>Sous-total ({cart.items.length} article{cart.items.length > 1 ? 's' : ''})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="eth-summary-row">
              <span>Livraison</span>
              <span style={{ color: 'var(--bio-main)', fontWeight: 600 }}>Calculée à l'étape suivante</span>
            </div>

            {/* ── Code promo ───────────────────────────────────────────── */}
            <hr className="eth-summary-hr" />
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-mid)', marginBottom: 8 }}>
              Code{appliedPromos.length > 1 ? 's' : ''} promo
              {appliedPromos.length > 0 && (
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: 'var(--text-light)', marginLeft: 6 }}>
                  ({appliedPromos.length}/2 appliqué{appliedPromos.length > 1 ? 's' : ''})
                </span>
              )}
            </p>

            {/* Notification auto-application (succès ou erreur) */}
            {autoNotice && (
              <AutoPromoNotice
                type={autoNotice.type}
                message={autoNotice.message}
                onDismiss={() => setAutoNotice(null)}
              />
            )}

            {/* Codes déjà appliqués */}
            {appliedPromos.map((p) => (
              <div key={p.code} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(45,90,46,.07)', border: '1px solid rgba(45,90,46,.2)',
                borderRadius: 'var(--r-sm)', padding: '8px 12px', marginBottom: 6, gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <i className="fa-solid fa-tag" style={{ color: 'var(--bio-main)', fontSize: 11 }}></i>
                  <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace', letterSpacing: '.05em' }}>{p.code}</span>
                  {universeLabel(p.universe) && (
                    <span style={{ fontSize: 10, background: p.universe === 'bio' ? 'rgba(45,90,46,.15)' : 'rgba(198,93,59,.12)', color: p.universe === 'bio' ? 'var(--bio-main)' : 'var(--tc-classic)', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>
                      {universeLabel(p.universe)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ color: 'var(--bio-main)', fontWeight: 700, fontSize: 13 }}>−{formatPrice(p.discount)}</span>
                  <button
                    onClick={() => removePromo(p.code)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '2px 4px', lineHeight: 1 }}
                    title="Retirer ce code"
                  >
                    <i className="fa-solid fa-xmark" style={{ fontSize: 12 }}></i>
                  </button>
                </div>
              </div>
            ))}

            {/* Saisie d'un nouveau code */}
            {appliedPromos.length < 2 && (
              <form className="eth-promo-form" onSubmit={handlePromoCheck}>
                <input
                  type="text"
                  placeholder="Ex : ETHNI10"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                  disabled={promoLoading}
                />
                <button type="submit" className="eth-btn-promo" disabled={promoLoading}>
                  {promoLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Appliquer'}
                </button>
              </form>
            )}
            {promoError && <p className="eth-promo-error">{promoError}</p>}

            {/* Aide multi-codes */}
            {appliedPromos.length === 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4, marginBottom: 0 }}>
                Jusqu'à 2 codes cumulables (Mode &amp; Bio séparément)
              </p>
            )}

            <hr className="eth-summary-hr" />

            {/* Lignes de réduction */}
            {appliedPromos.map((p) => (
              <div className="eth-summary-row eth-promo-row" key={`sum-${p.code}`}>
                <span>
                  <i className="fa-solid fa-tag me-1"></i>{p.code}
                  {universeLabel(p.universe) && (
                    <small style={{ color: 'var(--text-light)', marginLeft: 4 }}>({universeLabel(p.universe)})</small>
                  )}
                </span>
                <span className="eth-discount">−{formatPrice(p.discount)}</span>
              </div>
            ))}

            <div className="eth-summary-row eth-summary-total">
              <span>Total estimé</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>

            <button
              className="btn-eth-primary w-100 mt-4"
              style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => navigate('/commande', { state: { appliedPromos } })}
            >
              <i className="fa-solid fa-lock me-2"></i>
              Passer la commande
            </button>

            <div className="eth-payment-note mt-3">
              <i className="fa-solid fa-shield-halved"></i>
              Paiement sécurisé via <strong>Stripe</strong> — CB, Apple Pay, Google Pay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
