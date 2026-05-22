import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { productsAPI, wishlistAPI, reviewsAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import useCartStore from '../../store/cart';
import useAuthStore from '../../store/auth';
import useTracking from '../../hooks/useTracking';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

// ── Sélecteur d'étoiles interactif ────────────────────────────────────────────
function StarSelector({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="eth-star-selector">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className={`eth-star-btn ${(hover || value) >= s ? 'lit' : ''}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          aria-label={`${s} étoile${s > 1 ? 's' : ''}`}
        >
          <i className="fa-solid fa-star"></i>
        </button>
      ))}
      {(hover || value) > 0 && (
        <span className="eth-star-label">
          {['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'][hover || value]}
        </span>
      )}
    </div>
  );
}

// ── Affichage étoiles (lecture seule) ─────────────────────────────────────────
function Stars({ value = 0, size = 'sm' }) {
  return (
    <span className={`eth-stars eth-stars--${size}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <i
          key={s}
          className={
            value >= s ? 'fa-solid fa-star' :
            value >= s - 0.5 ? 'fa-solid fa-star-half-stroke' :
            'fa-regular fa-star'
          }
        ></i>
      ))}
    </span>
  );
}

// ── Carte article similaire ────────────────────────────────────────────────────
function SimilarCard({ product, isBio }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Link to={`${isBio ? '/bio' : ''}/produit/${product.slug}`} className="eth-similar-card">
      <div className="eth-similar-card-img">
        {product.main_image
          ? <img src={product.main_image} alt={product.name} />
          : <div className="eth-similar-card-placeholder"><i className="fa-solid fa-image"></i></div>
        }
        {product.discount_percent > 0 && (
          <span className="eth-similar-badge">-{product.discount_percent}%</span>
        )}
      </div>
      <div className="eth-similar-card-info">
        <p className="eth-similar-cat">{product.category_name}</p>
        <h6 className="eth-similar-name">{product.name}</h6>
        <div className="eth-similar-footer">
          <span className="eth-similar-price">{formatPrice(product.price)}</span>
          <button
            className={`eth-similar-add ${added ? 'added' : ''}`}
            onClick={handleAdd}
            title="Ajouter au panier"
          >
            <i className={`fa-solid ${added ? 'fa-check' : 'fa-plus'}`}></i>
          </button>
        </div>
      </div>
    </Link>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────────
export default function ProductDetailScreen() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const isBio      = location.pathname.startsWith('/bio');
  const basePath   = isBio ? '/bio' : '';
  const user       = useAuthStore((s) => s.user);
  const isAuth     = useAuthStore((s) => s.isAuthenticated);
  const { addItem } = useCartStore();
  const { trackEvent } = useTracking();

  const [product, setProduct]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [qty, setQty]                 = useState(1);
  const [activeImg, setActiveImg]     = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishFeedback, setWishFeedback] = useState('');
  const [cartFeedback, setCartFeedback] = useState(false);
  const [openSection, setOpenSection] = useState('description');
  const [similar, setSimilar]         = useState([]);
  const [copied, setCopied]           = useState(false);

  // ── Notify restock ────────────────────────────────────────────────────────
  const [notifyOpen, setNotifyOpen]     = useState(false);
  const [notifyEmail, setNotifyEmail]   = useState('');
  const [notifyPhone, setNotifyPhone]   = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [notifyDone, setNotifyDone]     = useState(false);
  const [notifyError, setNotifyError]   = useState('');

  // ── Avis ──────────────────────────────────────────────────────────────────
  const [reviews, setReviews]         = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [myReview, setMyReview]       = useState(null);   // avis de l'utilisateur connecté
  const [newRating, setNewRating]     = useState(0);
  const [newComment, setNewComment]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [reviewError, setReviewError] = useState('');

  // ── Chargement produit ────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    setSimilar([]);
    setReviews([]);
    setReviewsLoaded(false);
    setMyReview(null);
    setNewRating(0);
    setNewComment('');
    setNotifyOpen(false);
    setNotifyDone(false);
    setNotifyEmail('');
    setNotifyPhone('');
    setNotifyError('');
    productsAPI.detail(slug)
      .then(({ data }) => {
        setProduct(data);
        setLoading(false);
        trackEvent('product_view', {
          product_id:   data.id,
          product_name: data.name,
          universe:     data.category?.universe || '',
          value:        parseFloat(data.price),
        });
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // ── Articles similaires ───────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    productsAPI.related(slug)
      .then(({ data }) => setSimilar(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => {});
  }, [slug]);

  // ── Avis produit ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    reviewsAPI.list(slug)
      .then(({ data }) => {
        setReviews(data);
        setReviewsLoaded(true);
        if (isAuth && user) {
          // Déterminer si l'utilisateur a déjà un avis
          const display = buildDisplayName(user);
          const mine = data.find((r) => r.user_display === display);
          if (mine) setMyReview(mine);
        }
      })
      .catch(() => setReviewsLoaded(true));
  }, [slug, isAuth, user]);

  function buildDisplayName(u) {
    const name = (u?.full_name || '').trim();
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
      return parts[0];
    }
    return (u?.email || '').split('@')[0];
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleAddToCart() {
    addItem(product.id, qty);
    setCartFeedback(true);
    setTimeout(() => setCartFeedback(false), 2500);
  }

  function handleBuyNow() {
    addItem(product.id, qty);
    navigate('/panier');
  }

  function handleWishlist() {
    if (!isAuth) { navigate('/login'); return; }
    wishlistAPI.toggle(product.id)
      .then(({ data }) => {
        const added = data.status === 'added';
        setIsWishlisted(added);
        setWishFeedback(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
        setTimeout(() => setWishFeedback(''), 2500);
      })
      .catch(() => {});
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`${product.name} — ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function toggleSection(s) {
    setOpenSection(openSection === s ? null : s);
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!newRating) { setReviewError('Sélectionnez une note.'); return; }
    setSubmitting(true);
    setReviewError('');
    try {
      const { data } = await reviewsAPI.create(slug, { rating: newRating, comment: newComment });
      setReviews((prev) => [data, ...prev]);
      setMyReview(data);
      setNewRating(0);
      setNewComment('');
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewDelete() {
    try {
      await reviewsAPI.delete(slug);
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      setMyReview(null);
    } catch {}
  }

  async function handleNotifyRestock(e) {
    e.preventDefault();
    if (!notifyEmail) { setNotifyError('Veuillez saisir votre adresse e-mail.'); return; }
    setNotifySending(true);
    setNotifyError('');
    try {
      await productsAPI.notifyRestock(slug, { email: notifyEmail, phone: notifyPhone });
      setNotifyDone(true);
    } catch (err) {
      setNotifyError(err.response?.data?.error || 'Une erreur est survenue. Réessayez.');
    } finally {
      setNotifySending(false);
    }
  }

  // ── Calculs avis ─────────────────────────────────────────────────────────
  function buildDistribution(reviewList) {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewList.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
    return dist;
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: 'var(--cream)' }}>
      <div className="spinner-border eth-spinner" role="status" />
    </div>
  );

  if (!product) return (
    <div style={{ minHeight: '60vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <i className="fa-solid fa-triangle-exclamation fa-3x mb-4" style={{ color: 'var(--tc-light)' }}></i>
        <h4 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-dark)', marginBottom: 12 }}>Produit introuvable</h4>
        <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>Ce produit n'existe pas ou a été supprimé.</p>
        <Link to={`${basePath}/catalogue`} className="btn-eth-primary">
          <i className="fa-solid fa-arrow-left me-2"></i>Retour au catalogue
        </Link>
      </div>
    </div>
  );

  const images     = product.images?.length > 0 ? product.images : [];
  const currentImg = images[activeImg]?.image || product.main_image;
  const savings    = product.old_price
    ? (parseFloat(product.old_price) - parseFloat(product.price))
    : 0;
  const dist       = buildDistribution(reviews);
  const totalRev   = reviews.length;

  // Breadcrumbs pour JSON-LD
  const breadcrumbs = [
    { name: isBio ? 'Accueil Bio' : 'Accueil', url: basePath || '/' },
    { name: 'Catalogue', url: `${basePath}/catalogue` },
    ...(product.category ? [{ name: product.category.name, url: `${basePath}/catalogue?category=${product.category.slug}` }] : []),
    { name: product.name, url: isBio ? `/bio/produit/${product.slug}` : `/produit/${product.slug}` },
  ];

  return (
    <div className={isBio ? 'bio-pd' : ''} style={{ background: isBio ? 'var(--bio-cream)' : 'var(--cream)' }}>

      {/* ── SEO ─────────────────────────────────────────────────────────────── */}
      <SEO
        title={product.name}
        description={product.description ? product.description.slice(0, 160) : `Découvrez ${product.name} sur EthniSpirit.`}
        image={product.main_image}
        type="product"
        product={product}
        breadcrumbs={breadcrumbs}
      />

      {/* ── Bouton retour mobile ─────────────────────────────────────────────── */}
      <MobileBackButton
        to={`${basePath}/catalogue`}
        label="Catalogue"
        style={isBio ? {} : {}}
      />

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb eth-breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to={basePath || '/'}>{isBio ? 'Accueil Bio' : 'Accueil'}</Link></li>
              <li className="breadcrumb-item"><Link to={`${basePath}/catalogue`}>Catalogue</Link></li>
              {product.category && (
                <li className="breadcrumb-item">
                  <Link to={`${basePath}/catalogue?category=${product.category.slug}`}>{product.category.name}</Link>
                </li>
              )}
              <li className="breadcrumb-item active" style={{ color: 'rgba(233,216,201,.6)', fontSize: 13 }}>
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <div className="eth-page-body">
        <div className="eth-product-detail-layout">

          {/* ╔══════════════════════════════╗
              ║          GALERIE             ║
              ╚══════════════════════════════╝ */}
          <div className="eth-gallery">
            <div className="eth-gallery-main">
              {currentImg
                ? <img src={currentImg} alt={product.name} />
                : <div className="eth-gallery-placeholder"><i className="fa-solid fa-image"></i></div>
              }
              {product.discount_percent > 0 && (
                <span className="eth-badge-lg">-{product.discount_percent}%</span>
              )}
            </div>

            {images.length > 1 && (
              <div className="eth-gallery-thumbs mt-3">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    className={`eth-thumb ${idx === activeImg ? 'active' : ''}`}
                    onClick={() => setActiveImg(idx)}
                  >
                    <img src={img.image} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ╔══════════════════════════════╗
              ║        PANNEAU INFO          ║
              ╚══════════════════════════════╝ */}
          <div className="eth-product-detail-info">

            {/* ① Catégorie + social proof (vendus réels) */}
            <div className="eth-pd-toprow">
              <span className="eth-pd-cat-tag">{product.category?.name}</span>
              {product.sold_count > 0 && (
                <span className="eth-pd-sold-pill">
                  <i className="fa-solid fa-bag-shopping"></i>
                  {product.sold_count === 1
                    ? '1 personne a choisi cet article'
                    : `${product.sold_count} personnes ont choisi cet article`}
                </span>
              )}
            </div>

            {/* ② Titre — émotionnel, ancrage fort */}
            <h1 className="eth-product-detail-title">{product.name}</h1>

            {/* ③ Origine + certification */}
            <div className="eth-pd-credentials">
              {product.origin && (
                <span className="eth-pd-origin">
                  <i className="fa-solid fa-location-dot"></i>
                  {product.origin.toUpperCase()}
                </span>
              )}
              {product.certification && (
                <span className="eth-cert-badge">
                  <i className="fa-solid fa-leaf"></i>
                  {product.certification}
                </span>
              )}
            </div>

            {/* ④ Note moyenne — seulement si avis réels */}
            {product.avg_rating && (
              <div className="eth-pd-rating">
                <Stars value={product.avg_rating} size="md" />
                <span className="eth-pd-rating-num">{product.avg_rating}</span>
                <span className="eth-pd-rating-count">
                  ({product.review_count} avis{product.review_count > 1 ? '' : ''})
                </span>
              </div>
            )}

            <hr className="eth-product-divider" />

            {/* ⑤ Prix — ancrage cognitif : ancien prix visible en premier */}
            <div className="eth-pd-price-block">
              <div className="eth-pd-price-row">
                {product.old_price && (
                  <span className="eth-pd-old-price">{formatPrice(product.old_price)}</span>
                )}
                <span className="eth-pd-price">{formatPrice(product.price)}</span>
              </div>
              {savings > 0 && (
                <span className="eth-pd-savings">
                  <i className="fa-solid fa-tag me-1"></i>
                  Vous économisez {formatPrice(savings)}
                </span>
              )}
            </div>

            {/* ⑥ Scarcité — uniquement si stock < 5 (pression authentique) */}
            {product.stock > 0 && product.stock < 5 && (
              <div className="eth-pd-scarcity">
                <i className="fa-solid fa-circle-exclamation"></i>
                Plus que <strong>{product.stock} en stock</strong> — commandez vite
              </div>
            )}

            <hr className="eth-product-divider" />

            {product.stock > 0 ? (
              <>
                {/* ⑦ Quantité */}
                <div className="eth-pd-qty-row">
                  <span className="eth-pd-qty-label">Quantité</span>
                  <div className="eth-qty-selector">
                    <button onClick={() => setQty(Math.max(1, qty - 1))}>
                      <i className="fa-solid fa-minus"></i>
                    </button>
                    <span className="eth-qty-val">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))}>
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </div>

                {/* ⑧ CTA principal */}
                <button
                  className={`eth-pd-cta-primary ${cartFeedback ? 'added' : ''}`}
                  onClick={handleAddToCart}
                >
                  {cartFeedback
                    ? <><i className="fa-solid fa-circle-check me-2"></i>Ajouté au panier</>
                    : <><i className="fa-solid fa-bag-shopping me-2"></i>Ajouter au panier</>
                  }
                </button>

                {/* ⑨ Acheter maintenant — friction minimale */}
                <button className="eth-pd-cta-secondary" onClick={handleBuyNow}>
                  <i className="fa-solid fa-bolt me-2"></i>Acheter maintenant
                </button>

                {/* ⑩ Wishlist — engagement faible, capture l'intention */}
                <button className="eth-pd-wishlist-link" onClick={handleWishlist}>
                  <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart me-2`}
                     style={{ color: isWishlisted ? 'var(--tc-classic)' : undefined }}
                  ></i>
                  {isWishlisted ? 'Enregistré dans vos favoris' : 'Enregistrer dans mes favoris'}
                </button>
                {wishFeedback && (
                  <p className="eth-wish-msg"><i className="fa-solid fa-heart me-1"></i>{wishFeedback}</p>
                )}
              </>
            ) : (
              <div>
                <div className="eth-pd-unavailable">
                  <i className="fa-solid fa-circle-xmark me-2"></i>
                  Ce produit est temporairement indisponible
                </div>
                {notifyDone ? (
                  <div className="eth-notify-success">
                    <i className="fa-solid fa-circle-check me-2"></i>
                    Nous vous préviendrons dès que ce produit sera de nouveau disponible.
                  </div>
                ) : (
                  <>
                    <button
                      className="eth-notify-btn"
                      onClick={() => setNotifyOpen((v) => !v)}
                    >
                      <i className="fa-solid fa-bell me-2"></i>
                      Prévenez-moi du restockage
                    </button>
                    {notifyOpen && (
                      <form className="eth-notify-form" onSubmit={handleNotifyRestock}>
                        <input
                          type="email"
                          className="form-control eth-input"
                          placeholder="Votre adresse e-mail *"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          required
                        />
                        <input
                          type="tel"
                          className="form-control eth-input mt-2"
                          placeholder="Téléphone (facultatif)"
                          value={notifyPhone}
                          onChange={(e) => setNotifyPhone(e.target.value)}
                        />
                        {notifyError && (
                          <div className="eth-inline-error mt-2">
                            <i className="fa-solid fa-circle-exclamation me-2"></i>{notifyError}
                          </div>
                        )}
                        <button
                          type="submit"
                          className="btn-eth-primary mt-3"
                          style={{ padding: '10px 24px' }}
                          disabled={notifySending}
                        >
                          {notifySending
                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi…</>
                            : <><i className="fa-solid fa-paper-plane me-2"></i>M'alerter</>
                          }
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ⑪ Strip de confiance — après la décision, avant le regret */}
            <div className="eth-pd-trust-strip">
              <div className="eth-pd-trust-item">
                <i className="fa-solid fa-truck-fast"></i>
                <div>
                  <strong>Livraison 5–8 jours</strong>
                  <span>Martinique, Guadeloupe et DOM-TOM</span>
                </div>
              </div>
              <div className="eth-pd-trust-item">
                <i className="fa-solid fa-rotate-left"></i>
                <div>
                  <strong>Retours gratuits</strong>
                  <span>14 jours, produit non utilisé</span>
                </div>
              </div>
              <div className="eth-pd-trust-item">
                <i className="fa-solid fa-shield-halved"></i>
                <div>
                  <strong>Paiement sécurisé</strong>
                  <span>Stripe — CB, Apple Pay, 3DS2</span>
                </div>
              </div>
            </div>

            {/* ⑫ Accordéon — informations progressives */}
            <div className="eth-product-accordion">
              {[
                {
                  id: 'description',
                  icon: 'fa-align-left',
                  label: 'Description',
                  content: (
                    product.description
                      ? <p>{product.description}</p>
                      : <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>
                          Aucune description disponible.
                        </p>
                  ),
                },
                {
                  id: 'caracteristiques',
                  icon: 'fa-list-check',
                  label: 'Caractéristiques',
                  content: (
                    <ul className="eth-specs-list">
                      {product.origin && (
                        <li><i className="fa-solid fa-location-dot"></i><span>Origine</span><strong>{product.origin}</strong></li>
                      )}
                      {product.certification && (
                        <li><i className="fa-solid fa-leaf"></i><span>Certification</span><strong>{product.certification}</strong></li>
                      )}
                      <li><i className="fa-solid fa-tag"></i><span>Catégorie</span><strong>{product.category?.name}</strong></li>
                    </ul>
                  ),
                },
                {
                  id: 'livraison',
                  icon: 'fa-truck',
                  label: 'Livraison & retours',
                  content: (
                    <ul className="eth-specs-list">
                      <li><i className="fa-solid fa-map-location-dot"></i><span>Zones</span><strong>Martinique, Guadeloupe, Saint-Martin, Guyane, Réunion</strong></li>
                      <li><i className="fa-solid fa-clock"></i><span>Délai</span><strong>5 à 8 jours ouvrés après expédition</strong></li>
                      <li><i className="fa-solid fa-rotate-left"></i><span>Retours</span><strong>Gratuits sous 14 jours, produit non utilisé</strong></li>
                      <li><i className="fa-solid fa-shield-halved"></i><span>Paiement</span><strong>Sécurisé par Stripe — CB, Apple Pay, Google Pay</strong></li>
                    </ul>
                  ),
                },
              ].map(({ id, icon, label, content }) => (
                <div key={id} className={`eth-accordion-item ${openSection === id ? 'open' : ''}`}>
                  <button className="eth-accordion-trigger" onClick={() => toggleSection(id)}>
                    <span><i className={`fa-solid ${icon} me-2`}></i>{label}</span>
                    <i className={`fa-solid fa-chevron-${openSection === id ? 'up' : 'down'}`}></i>
                  </button>
                  {openSection === id && (
                    <div className="eth-accordion-body">{content}</div>
                  )}
                </div>
              ))}
            </div>

            {/* ⑬ Partage — action secondaire, en dernier */}
            <div className="eth-share-row">
              <span className="eth-share-label"><i className="fa-solid fa-share-nodes me-1"></i>Partager</span>
              <button className="eth-share-btn whatsapp" onClick={handleWhatsApp}>
                <i className="fa-brands fa-whatsapp"></i>
              </button>
              <button className="eth-share-btn link" onClick={handleCopyLink}>
                <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'} me-1`}></i>
                {copied ? 'Copié !' : 'Lien'}
              </button>
            </div>

          </div>
          {/* fin panneau info */}
        </div>
        {/* fin layout principal */}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION AVIS
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="eth-reviews-section">
          <div className="eth-reviews-header-row">
            <h2 className="eth-reviews-title">
              Avis clients
              {totalRev > 0 && (
                <span className="eth-reviews-count-badge">{totalRev}</span>
              )}
            </h2>
          </div>

          <div className="eth-reviews-layout">

            {/* ── Récapitulatif notes ─────────────────────────────────────── */}
            <div className="eth-reviews-summary">
              {totalRev > 0 ? (
                <>
                  <div className="eth-reviews-avg-block">
                    <span className="eth-reviews-avg-num">{product.avg_rating}</span>
                    <Stars value={product.avg_rating} size="lg" />
                    <span className="eth-reviews-avg-label">sur 5 · {totalRev} avis</span>
                  </div>
                  <div className="eth-star-bars">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const count = dist[s] || 0;
                      const pct   = totalRev > 0 ? Math.round((count / totalRev) * 100) : 0;
                      return (
                        <div key={s} className="eth-star-bar-row">
                          <span className="eth-star-bar-label">{s}</span>
                          <i className="fa-solid fa-star eth-star-bar-icon"></i>
                          <div className="eth-star-bar-track">
                            <div className="eth-star-bar-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="eth-star-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="eth-reviews-empty-summary">
                  <div className="eth-reviews-empty-stars">
                    <Stars value={0} size="lg" />
                  </div>
                  <p className="eth-reviews-empty-label">Aucun avis pour l'instant</p>
                  <p className="eth-reviews-empty-sub">Soyez le premier à donner votre avis sur ce produit.</p>
                </div>
              )}
            </div>

            {/* ── Formulaire + liste ──────────────────────────────────────── */}
            <div className="eth-reviews-main">

              {/* Formulaire d'avis */}
              {!isAuth ? (
                <div className="eth-reviews-login-prompt">
                  <i className="fa-solid fa-user-lock"></i>
                  <div>
                    <strong>Partagez votre expérience</strong>
                    <p>
                      <Link to="/login">Connectez-vous</Link> pour laisser un avis sur ce produit.
                    </p>
                  </div>
                </div>
              ) : myReview ? (
                <div className="eth-review-mine">
                  <div className="eth-review-mine-header">
                    <div>
                      <span className="eth-review-mine-label">Votre avis</span>
                      {myReview.verified && (
                        <span className="eth-verified-badge">
                          <i className="fa-solid fa-circle-check me-1"></i>Achat vérifié
                        </span>
                      )}
                    </div>
                    <button className="eth-review-delete-btn" onClick={handleReviewDelete}>
                      <i className="fa-solid fa-trash-can me-1"></i>Supprimer
                    </button>
                  </div>
                  <Stars value={myReview.rating} size="md" />
                  {myReview.comment && <p className="eth-review-comment">{myReview.comment}</p>}
                </div>
              ) : (
                <form className="eth-review-form" onSubmit={handleReviewSubmit}>
                  <h6 className="eth-review-form-title">
                    <i className="fa-regular fa-star me-2"></i>Laisser un avis
                  </h6>
                  <StarSelector value={newRating} onChange={setNewRating} />
                  <textarea
                    className="form-control eth-input eth-review-textarea"
                    placeholder="Décrivez votre expérience (facultatif)…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  {reviewError && (
                    <div className="eth-inline-error mt-2">
                      <i className="fa-solid fa-circle-exclamation me-2"></i>{reviewError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn-eth-primary mt-3"
                    style={{ padding: '10px 28px' }}
                    disabled={submitting || !newRating}
                  >
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi…</>
                      : <><i className="fa-solid fa-paper-plane me-2"></i>Publier mon avis</>
                    }
                  </button>
                </form>
              )}

              {/* Liste des avis */}
              {reviewsLoaded && reviews.length > 0 && (
                <div className="eth-review-list">
                  {reviews.map((r) => (
                    <div key={r.id} className="eth-review-card">
                      <div className="eth-review-card-header">
                        <div className="eth-review-avatar">
                          {r.user_display.charAt(0).toUpperCase()}
                        </div>
                        <div className="eth-review-meta">
                          <span className="eth-review-author">{r.user_display}</span>
                          {r.verified && (
                            <span className="eth-verified-badge">
                              <i className="fa-solid fa-circle-check me-1"></i>Achat vérifié
                            </span>
                          )}
                          <span className="eth-review-date">
                            {new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <Stars value={r.rating} size="sm" />
                      </div>
                      {r.comment && <p className="eth-review-comment">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {reviewsLoaded && reviews.length === 0 && !isAuth && (
                <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 16 }}>
                  Aucun avis pour l'instant.
                </p>
              )}
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            ARTICLES SIMILAIRES
        ═══════════════════════════════════════════════════════════════════ */}
        {similar.length > 0 && (
          <section className="eth-similar-section">
            <div className="eth-similar-header">
              <div>
                <p className="eth-section-label" style={{ color: 'var(--tc-classic)' }}>De la même collection</p>
                <h2 className="eth-similar-title">Vous aimerez aussi</h2>
              </div>
              <Link to={`${basePath}/catalogue?category=${product.category?.slug}`} className="eth-similar-see-all">
                Voir tout <i className="fa-solid fa-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="eth-similar-grid">
              {similar.map((p) => <SimilarCard key={p.id} product={p} isBio={isBio} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
