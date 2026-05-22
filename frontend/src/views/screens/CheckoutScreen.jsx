import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ordersAPI, shippingAPI, cartAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import useCartStore from '../../store/cart';
import useAuthStore from '../../store/auth';
import useTracking, { getStoredUTM } from '../../hooks/useTracking';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

export default function CheckoutScreen() {
  const location = useLocation();
  const navigate  = useNavigate();
  // Rétrocompat : accepte aussi l'ancien `promo` (objet unique) en plus du nouveau `appliedPromos` (tableau)
  const appliedPromos = location.state?.appliedPromos
    || (location.state?.promo ? [location.state.promo] : []);
  const { cart, fetchCart, clearCart } = useCartStore();
  const { user, isAuthenticated, fetchMe } = useAuthStore();

  const [form, setForm] = useState({
    full_name:   '',
    email:       '',
    phone:       '',
    address:     '',
    city:        '',
    postal_code: '',
    country:     'Martinique',
  });
  const { trackEvent } = useTracking();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [shipping, setShipping]   = useState({
    cost: null, zone: null, days_min: 5, days_max: 8, is_free: false, free_above: null,
  });
  const [shippingLoading, setShippingLoading] = useState(false);

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    if (!cart) fetchCart();
    // Récupère le profil complet (adresse, téléphone, etc.) si connecté
    if (isAuthenticated) fetchMe();
  }, []);

  // Dès que le panier est chargé, calculer la livraison pour la destination par défaut
  useEffect(() => {
    if (cart?.total !== undefined) {
      fetchShipping(form.country, parseFloat(cart.total));
    }
  }, [cart?.total]);

  // ── Pré-remplissage dès que user est disponible/mis à jour ────────────────
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      full_name:   user.full_name   || prev.full_name,
      email:       user.email       || prev.email,
      // profile peut venir de fetchMe() — le JWT n'a que full_name/email
      phone:       user.profile?.phone   || user.phone   || prev.phone,
      address:     user.profile?.address || prev.address,
      city:        user.profile?.city    || prev.city,
      postal_code: prev.postal_code,
      country:     user.profile?.country || prev.country || 'Martinique',
    }));
  }, [user]);

  // ── Devis livraison ────────────────────────────────────────────────────────
  const fetchShipping = useCallback(async (destination, sub) => {
    if (!destination) return;
    setShippingLoading(true);
    try {
      const { data } = await shippingAPI.quote(destination, sub || 0);
      setShipping({
        cost:       parseFloat(data.cost),
        zone:       data.zone,
        days_min:   data.days_min,
        days_max:   data.days_max,
        is_free:    data.is_free,
        free_above: parseFloat(data.free_above) || null,
      });
    } catch {
      // Fallback silencieux — on garde le devis précédent ou null
    } finally {
      setShippingLoading(false);
    }
  }, []);

  // ── Sauvegarde email au panier (pour relance panier abandonné) ──────────────
  const emailSaveTimer = useRef(null);
  function saveEmailToCart(email) {
    if (!email || !email.includes('@')) return;
    clearTimeout(emailSaveTimer.current);
    emailSaveTimer.current = setTimeout(() => {
      cartAPI.saveEmail(email).catch(() => {});
    }, 1500); // debounce 1.5s
  }

  function handleChange(e) {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (e.target.name === 'country') {
      fetchShipping(e.target.value, parseFloat(cart?.total || 0));
    }
    if (e.target.name === 'email') {
      saveEmailToCart(e.target.value);
    }
  }

  const subtotal      = parseFloat(cart?.total || 0);
  const totalDiscount = appliedPromos.reduce((acc, p) => acc + parseFloat(p.discount || 0), 0);
  const shippingCost  = shipping.cost !== null ? shipping.cost : 0;
  const finalTotal    = Math.max(subtotal - totalDiscount + shippingCost, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cart?.items?.length) {
      setError('Votre panier est vide.');
      return;
    }
    setLoading(true);
    setError('');
    trackEvent('begin_checkout', { value: finalTotal });
    try {
      const utm = getStoredUTM();
      const { data } = await ordersAPI.create({
        ...form,
        promo_codes:    appliedPromos.map((p) => p.code),
        shipping_cost:  shippingCost.toFixed(2),
        create_account: !isAuthenticated && createAccount,
        ...utm,
      });

      if (data.checkout_url) {
        // On vide le panier seulement au moment de quitter vers Stripe
        clearCart();
        window.location.href = data.checkout_url;
      } else {
        // Total = 0 (promo 100%) — commande directement confirmée
        clearCart();
        navigate(`/paiement-succes?oid=${data.oid}`);
      }
    } catch (err) {
      // Erreur Stripe (502) ou autre
      const msg = err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--cream)' }}>
      <SEO title="Finaliser la commande" description="Complétez votre commande EthniSpirit en toute sécurité." noindex={true} />
      <MobileBackButton to="/panier" label="Panier" />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Étape finale</p>
            <h1 className="eth-section-title">Finaliser la <em>commande</em></h1>
          </div>
        </div>
      </div>

      {/* ── Contenu ───────────────────────────────────────────────────────── */}
      <div className="eth-page-body">
        <div className="eth-checkout-layout">

          {/* ── Formulaire ────────────────────────────────────────────────── */}
          <div>
            <div className="eth-checkout-box">

              {/* Infos personnelles */}
              <h5 className="eth-checkout-section-title">
                <i className="fa-solid fa-user"></i>
                Informations personnelles
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="eth-label">Nom complet *</label>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      className="form-control eth-input"
                      required
                      placeholder="Marie Dupont"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="eth-label">Email *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="form-control eth-input"
                      required
                      placeholder="marie@email.fr"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="eth-label">Téléphone</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="form-control eth-input"
                      placeholder="+596 696 00 00 00"
                    />
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--sand)', margin: '24px 0' }} />

                {/* Adresse */}
                <h5 className="eth-checkout-section-title">
                  <i className="fa-solid fa-location-dot"></i>
                  Adresse de livraison
                </h5>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="eth-label">Adresse *</label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="form-control eth-input"
                      rows={2}
                      required
                      placeholder="12 rue des Flamboyants, Résidence Les Orchidées..."
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="eth-label">Ville *</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="form-control eth-input"
                      required
                      placeholder="Fort-de-France"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="eth-label">Code postal</label>
                    <input
                      name="postal_code"
                      value={form.postal_code}
                      onChange={handleChange}
                      className="form-control eth-input"
                      placeholder="97200"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="eth-label">Île / Territoire *</label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="form-select eth-input"
                    >
                      <option>Martinique</option>
                      <option>Guadeloupe</option>
                      <option>Saint-Martin</option>
                      <option>Saint-Barthélemy</option>
                      <option>Guyane</option>
                      <option>La Réunion</option>
                      <option>Île-de-France</option>
                      <option>Autre (France métropolitaine)</option>
                    </select>
                  </div>
                </div>

                {/* Créer un compte */}
                {!isAuthenticated && (
                  <div style={{
                    background: 'var(--cream)', border: '1px solid var(--sand)',
                    borderRadius: 'var(--r-sm)', padding: '14px 16px', marginTop: 20,
                  }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        style={{ marginTop: 2, accentColor: 'var(--tc-classic)', width: 16, height: 16, flexShrink: 0 }}
                      />
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>
                          Créer un compte pour suivre mes commandes
                        </span>
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-light)' }}>
                          Vos identifiants vous seront envoyés par email. Vous pourrez changer votre mot de passe depuis votre espace personnel.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Erreur */}
                {error && (
                  <div className="eth-inline-error mt-3">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
                  </div>
                )}

                {/* Note Stripe */}
                <div style={{
                  background: 'var(--cream)',
                  border: '1px solid var(--sand)',
                  borderRadius: 'var(--r-sm)',
                  padding: '12px 16px',
                  marginTop: 24,
                  fontSize: 13,
                  color: 'var(--text-mid)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: 'var(--bio-main)', marginTop: 1, flexShrink: 0 }}></i>
                  <span>
                    Vous serez redirigé(e) vers la page de paiement sécurisée <strong>Stripe</strong>.
                    CB, Visa, Mastercard, Apple Pay &amp; Google Pay acceptés — chiffrement SSL, conforme 3DS2.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-eth-primary w-100 mt-3"
                  style={{ justifyContent: 'center', padding: '14px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Redirection vers Stripe…</>
                  ) : (
                    <><i className="fa-solid fa-lock me-2"></i>Payer {formatPrice(finalTotal)} en sécurité</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ── Récapitulatif ──────────────────────────────────────────────── */}
          <div className="eth-cart-summary">
            <h5 className="eth-summary-title">Votre commande</h5>

            {cart?.items?.map((item) => (
              <div className="eth-summary-product" key={item.id}>
                <span className="eth-summary-product-name">
                  {item.product.name}
                  <small style={{ color: 'var(--text-light)', marginLeft: 6 }}>×{item.quantity}</small>
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}

            <hr className="eth-summary-hr" />

            {/* Livraison */}
            <div className="eth-summary-row" style={{ color: 'var(--text-mid)', fontSize: 13 }}>
              <span>
                <i className="fa-solid fa-truck-fast me-1" style={{ color: 'var(--tc-classic)' }}></i>
                Livraison
                {shipping.zone && (
                  <span style={{ color: 'var(--text-light)', marginLeft: 4 }}>
                    — {shipping.days_min}–{shipping.days_max}j
                  </span>
                )}
              </span>
              <span>
                {shippingLoading ? (
                  <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }}></span>
                ) : shipping.cost === null ? (
                  <span style={{ color: 'var(--text-light)' }}>—</span>
                ) : shipping.is_free ? (
                  <span style={{ color: 'var(--bio-main)', fontWeight: 600 }}>Offerte</span>
                ) : (
                  formatPrice(shipping.cost)
                )}
              </span>
            </div>

            {/* Message livraison gratuite à partir de X */}
            {shipping.free_above && shipping.free_above > 0 && !shipping.is_free && (
              <div style={{
                fontSize: 11, color: 'var(--bio-main)', marginTop: 2, textAlign: 'right',
              }}>
                Gratuite dès {formatPrice(shipping.free_above)} d'achat
              </div>
            )}

            {appliedPromos.map((p) => (
              <div className="eth-summary-row eth-promo-row" key={p.code}>
                <span>
                  <i className="fa-solid fa-tag me-1"></i>{p.code}
                  {p.universe && p.universe !== 'all' && (
                    <small style={{ color: 'var(--text-light)', marginLeft: 4 }}>
                      ({p.universe === 'mode' ? 'Mode' : 'Bio'})
                    </small>
                  )}
                </span>
                <span className="eth-discount">−{formatPrice(p.discount)}</span>
              </div>
            ))}

            <div className="eth-summary-row eth-summary-total">
              <span>Total TTC</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>

            <div className="eth-payment-note mt-3">
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--bio-main)' }}></i>
              Paiement sécurisé <strong>Stripe</strong> — CB, Visa, Mastercard, Apple Pay
            </div>
            <div className="eth-payment-note mt-2">
              <i className="fa-solid fa-rotate-left"></i>
              Retours acceptés sous 14 jours
            </div>
            <div className="eth-payment-note mt-2">
              <i className="fa-solid fa-truck-fast"></i>
              {shipping.zone
                ? `Livraison ${shipping.days_min}–${shipping.days_max} jours ouvrés`
                : 'Livraison estimée selon destination'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
