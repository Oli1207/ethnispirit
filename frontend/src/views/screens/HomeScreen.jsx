import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesAPI, productsAPI, newsletterAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import useCartStore from '../../store/cart';
import SEO from '../../components/SEO';
import heroBg from '../../assets/hero_bg.png';

// ── Images Mode — femme antillaise, mode africaine, bijoux ────────────────────
const HERO_IMG  = heroBg;
const HERO_IMG2 = 'https://images.unsplash.com/photo-1664151099399-d41ed991a10d?w=700&q=85'; // robe africaine wax print
const HERO_IMG3 = 'https://images.unsplash.com/photo-1579624054375-72037da740e5?w=700&q=85'; // collier perles africain
const STORY_IMG = 'https://images.unsplash.com/photo-1768212565424-efa3a3852b81?w=900&q=85'; // tissus africains colorés

const MARQUEE_ITEMS = [
  'Artisanat Ivoirien', 'Livraison Caraïbes', 'Fait avec Amour',
  'Mode Authentique', 'Pièces Uniques', 'Femme Antillaise',
  'Elegance Africaine', 'Certifié Naturel', 'Collection 2025',
];

const TESTIMONIALS = [
  { name: 'Amenan K.', island: 'Martinique', stars: 5, text: 'Des pièces sublimes, vraiment uniques. Je reçois des compliments à chaque fois que je porte ma robe. Qualité exceptionnelle.' },
  { name: 'Emmanuella N.', island: 'Guadeloupe', stars: 5, text: 'Livraison rapide et emballage soigné. Les bijoux sont magnifiques, exactement comme sur les photos. Je recommande !' },
  { name: 'Anne V.', island: 'Martinique', stars: 5, text: 'Enfin une boutique qui comprend le style antillais avec une touche africaine. Je suis fan, je commande régulièrement.' },
];

function Stars({ n = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <i key={i} className={`fa-${i < n ? 'solid' : 'regular'} fa-star`} style={{ fontSize: 13, color: '#F59E0B' }}></i>
      ))}
    </div>
  );
}

export default function HomeScreen() {
  const [categories, setCategories] = useState([]);
  const [featured,   setFeatured]   = useState([]);
  const [newsEmail,  setNewsEmail]  = useState('');
  const [newsSent,   setNewsSent]   = useState(false);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    categoriesAPI.list('mode').then(({ data }) => setCategories(data)).catch(() => {});
    productsAPI.list({ universe: 'mode', featured: '1' }).then(({ data }) => setFeatured(data.slice(0, 4))).catch(() => {});
  }, []);

  // ── Scroll reveal ────────────────────────────────────────────────────────
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]:not(.revealed)');
    if (!els.length) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [featured]);

  function handleNewsletter(e) {
    e.preventDefault();
    newsletterAPI.subscribe(newsEmail, 'mode').then(() => setNewsSent(true)).catch(() => {});
  }

  const cats = categories.length > 0 ? categories.slice(0, 4) : [
    { id: 1, name: 'Bijoux',     slug: 'bijoux',     image: null },
    { id: 2, name: 'Vêtements',  slug: 'vetements',  image: null },
    { id: 3, name: 'Sacs',       slug: 'sacs',       image: null },
    { id: 4, name: 'Chaussures', slug: 'chaussures', image: null },
  ];

  return (
    <>
      <SEO
        title={null}
        description="Mode antillaise authentique & cosmétiques bio naturels. Bijoux, vêtements, soins — livraison en Martinique, Guadeloupe et DOM-TOM."
        isHome={true}
      />

      {/* ══════════════════════════════════════════════════════════════════
          HERO — Plein écran, éditorial
      ══════════════════════════════════════════════════════════════════ */}
      <section className="lp-hero">
        {/* Background image */}
        <div className="lp-hero-bg">
          <img src={HERO_IMG} alt="" className="lp-hero-bg-img" />
          <div className="lp-hero-gradient"></div>
        </div>

        {/* Content */}
        <div className="lp-hero-inner">
          <div className="lp-hero-left">
            <div className="lp-hero-eyebrow">
              <span className="lp-pulse"></span>
              Nouvelle Collection 2025
            </div>
            <h1 className="lp-hero-h1">
              L'Élégance<br />
              <em>Africaine</em><br />
              <span className="lp-hero-h1-sub">dans la Caraïbe</span>
            </h1>
            <p className="lp-hero-desc">
              Bijoux, tenues et accessoires d'origine ivoirienne,<br className="d-none d-lg-block" />
              soigneusement sélectionnés pour la femme antillaise.
            </p>
            <div className="lp-hero-actions">
              <Link to="/catalogue" className="lp-btn-main">
                <i className="fa-solid fa-sparkles me-2"></i>
                Découvrir la collection
              </Link>
              <Link to="/a-propos" className="lp-btn-ghost">
                Notre histoire
              </Link>
            </div>

            {/* Stats */}
            <div className="lp-hero-stats">
              {[
                { val: '200+',  lbl: 'Produits' },
                { val: '4.9 ★', lbl: 'Note moyenne' },
                { val: '2',     lbl: 'Îles livrées' },
              ].map(s => (
                <div key={s.lbl} className="lp-stat">
                  <div className="lp-stat-val">{s.val}</div>
                  <div className="lp-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Collage d'images flottant */}
          <div className="lp-hero-right">
            <div className="lp-hero-collage">
              <div className="lp-col-main">
                <img src={HERO_IMG2} alt="Mode" />
                <div className="lp-col-tag">Tenues</div>
              </div>
              <div className="lp-col-side">
                <div className="lp-col-sm">
                  <img src={HERO_IMG3} alt="Bijoux" />
                  <div className="lp-col-tag sm">Bijoux</div>
                </div>
                <div className="lp-col-badge">
                  <i className="fa-solid fa-certificate"></i>
                  <span>100% Authentique</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="lp-scroll-hint">
          <div className="lp-scroll-mouse"><div className="lp-scroll-dot"></div></div>
          <span>Défiler</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MARQUEE — Valeurs en défilement
      ══════════════════════════════════════════════════════════════════ */}
      <div className="lp-marquee">
        <div className="lp-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="lp-marquee-item">
              {item} <span className="lp-marquee-sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CATÉGORIES — 4 grandes cartes éditoriales
      ══════════════════════════════════════════════════════════════════ */}
      <section className="lp-section lp-section-white">
        <div className="lp-container">
          <div className="lp-section-header" data-reveal>
            <div>
              <p className="lp-eyebrow-dark">Explorer</p>
              <h2 className="lp-title">Nos <em>Catégories</em></h2>
            </div>
            <Link to="/catalogue" className="lp-link-more">
              Tout voir <i className="fa-solid fa-arrow-right ms-1"></i>
            </Link>
          </div>

          <div className="lp-cat-grid">
            {cats.map((cat, i) => {
              const CAT_IMGS = [
                'https://images.unsplash.com/photo-1664151099736-1ac6365a25aa?w=700&q=85', // vêtements — robe africaine
                'https://images.unsplash.com/photo-1629481995102-ff98d306dd8a?w=700&q=85', // bijoux — collier perles
                'https://images.unsplash.com/photo-1768212565424-efa3a3852b81?w=700&q=85', // accessoires — tissus africains
                'https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=700&q=85', // tenues cérémonie
              ];
              return (
                <Link key={cat.id} to={`/catalogue?category=${cat.slug}`} className={`lp-cat-card lp-cat-${i}`} data-reveal data-delay={i > 0 ? String(i) : undefined}>
                  <img src={cat.image || CAT_IMGS[i]} alt={cat.name} className="lp-cat-img" />
                  <div className="lp-cat-overlay">
                    <div className="lp-cat-text">
                      <p className="lp-cat-sub">{cat.product_count || '—'} articles</p>
                      <h3 className="lp-cat-name">{cat.name}</h3>
                    </div>
                    <div className="lp-cat-arrow">
                      <i className="fa-solid fa-arrow-right"></i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          COUPS DE CŒUR — Produits vedettes
      ══════════════════════════════════════════════════════════════════ */}
      <section className="lp-section lp-section-cream">
        <div className="lp-container">
          <div className="lp-section-header" data-reveal>
            <div>
              <p className="lp-eyebrow-dark">Sélection</p>
              <h2 className="lp-title">Coups de <em>cœur</em></h2>
            </div>
            <Link to="/catalogue" className="lp-link-more">
              Voir tout <i className="fa-solid fa-arrow-right ms-1"></i>
            </Link>
          </div>

          <div className="lp-products-grid">
            {(featured.length > 0 ? featured : Array.from({ length: 4 }).map((_, i) => ({ id: i, _skeleton: true }))).map((p, i) => (
              p._skeleton ? (
                <div key={i} className="lp-product-card lp-product-skeleton">
                  <div className="lp-product-img-wrap lp-skeleton-img"></div>
                  <div style={{ padding: '14px 0' }}>
                    <div className="lp-sk-line short" style={{ height: 10, marginBottom: 8 }}></div>
                    <div className="lp-sk-line" style={{ height: 14, marginBottom: 10 }}></div>
                    <div className="lp-sk-line short" style={{ height: 10 }}></div>
                  </div>
                </div>
              ) : (
                <div key={p.id} className="lp-product-card" data-reveal data-delay={i > 0 ? String(i) : undefined}>
                  <Link to={`/produit/${p.slug}`} className="lp-product-img-wrap">
                    {p.main_image
                      ? <img src={p.main_image} alt={p.name} className="lp-product-img" loading="eager" />
                      : <div className="lp-product-img-ph"><i className="fa-solid fa-image"></i></div>}
                    {p.discount_percent > 0 && <span className="lp-badge-disc">−{p.discount_percent}%</span>}
                    <div className="lp-product-actions">
                      <button onClick={(e) => { e.preventDefault(); addItem(p.id, 1); }} className="lp-quick-add" disabled={!p.stock}>
                        <i className="fa-solid fa-bag-shopping me-2"></i>
                        {p.stock ? 'Ajouter' : 'Rupture'}
                      </button>
                    </div>
                  </Link>
                  <div className="lp-product-body">
                    <p className="lp-product-cat">{p.category_name}</p>
                    <h6 className="lp-product-name">
                      <Link to={`/produit/${p.slug}`}>{p.name}</Link>
                    </h6>
                    <div className="lp-product-footer">
                      <div>
                        <span className="lp-product-price">{formatPrice(p.price)}</span>
                        {p.old_price && <span className="lp-product-old ms-2">{formatPrice(p.old_price)}</span>}
                      </div>
                      {p.certification && <span className="lp-product-cert">{p.certification}</span>}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HISTOIRE — Notre ADN
      ══════════════════════════════════════════════════════════════════ */}
      <section className="lp-story">
        <div className="lp-story-inner">
          <div className="lp-story-visual" data-reveal="slide-left">
            <div className="lp-story-img-main">
              <img src={STORY_IMG} alt="Artisanat" />
            </div>
            <div className="lp-story-float-card">
              <i className="fa-solid fa-hands-holding"></i>
              <div>
                <strong>Sélectionnés à la main</strong>
                <span>Côte d'Ivoire → Caraïbe</span>
              </div>
            </div>
          </div>

          <div className="lp-story-content" data-reveal="slide-right">
            <p className="lp-eyebrow-dark">Notre histoire</p>
            <h2 className="lp-title" style={{ textAlign: 'left' }}>
              Chaque pièce raconte<br /><em>une histoire</em>
            </h2>
            <p className="lp-story-text">
              EthniSpirit est né d'un amour profond pour l'artisanat africain et la culture antillaise.
              Chaque bijou, chaque tenue est choisi directement auprès d'artisans ivoiriens,
              pour apporter un peu de leur âme à la femme caribéenne.
            </p>
            <div className="lp-story-pillars">
              {[
                { icon: 'fa-gem',               title: 'Origine',      desc: 'Côte d\'Ivoire, sourcing direct artisans' },
                { icon: 'fa-award',             title: 'Qualité',      desc: 'Chaque pièce inspectée et sélectionnée' },
                { icon: 'fa-heart',             title: 'Authenticité', desc: 'Culture et héritage africain préservés' },
              ].map(p => (
                <div key={p.title} className="lp-pillar">
                  <div className="lp-pillar-icon">
                    <i className={`fa-solid ${p.icon}`}></i>
                  </div>
                  <div>
                    <strong className="lp-pillar-title">{p.title}</strong>
                    <p className="lp-pillar-desc">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/a-propos" className="lp-btn-story">
              Lire notre histoire <i className="fa-solid fa-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PROMO STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <div className="lp-promo-strip" data-reveal="fade">
        <i className="fa-solid fa-tag"></i>
        <span>1ère commande :</span>
        <span className="lp-promo-code">ETHNI10</span>
        <span>— 10% de réduction</span>
        <Link to="/catalogue" className="lp-promo-cta">
          En profiter <i className="fa-solid fa-arrow-right ms-1"></i>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TÉMOIGNAGES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="lp-section lp-section-white">
        <div className="lp-container">
          <div className="lp-section-header" style={{ justifyContent: 'center', textAlign: 'center' }} data-reveal="fade">
            <div>
              <p className="lp-eyebrow-dark">Avis clients</p>
              <h2 className="lp-title">Elles nous font <em>confiance</em></h2>
            </div>
          </div>
          <div className="lp-reviews-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-review-card" data-reveal data-delay={i > 0 ? String(i) : undefined}>
                <Stars n={t.stars} />
                <p className="lp-review-text">"{t.text}"</p>
                <div className="lp-review-author">
                  <div className="lp-review-avatar">
                    {t.name[0]}
                  </div>
                  <div>
                    <strong className="lp-review-name">{t.name}</strong>
                    <span className="lp-review-island">
                      <i className="fa-solid fa-location-dot me-1"></i>{t.island}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          BIO TEASER — Univers nature
      ══════════════════════════════════════════════════════════════════ */}
      <section className="lp-bio-teaser">
        <div className="lp-bio-inner">
          <div className="lp-bio-content" data-reveal="slide-left">
            <div className="lp-bio-badge">
              <i className="fa-solid fa-leaf me-2"></i>Nouvel univers
            </div>
            <h2 className="lp-bio-title">
              EthniSpirit<br /><em>Bio & Naturel</em>
            </h2>
            <p className="lp-bio-desc">
              Soins, huiles essentielles, tisanes et produits alimentaires bio
              d'origine tropicale. La nature antillaise, en bouteille.
            </p>
            <div className="lp-bio-feats">
              {['100% Naturel', 'Certifié Bio', 'Commerce équitable'].map(f => (
                <span key={f} className="lp-bio-feat">
                  <i className="fa-solid fa-check me-2"></i>{f}
                </span>
              ))}
            </div>
            <Link to="/bio" className="lp-btn-bio">
              Explorer l'univers Bio <i className="fa-solid fa-arrow-right ms-2"></i>
            </Link>
          </div>
          <div className="lp-bio-visual" data-reveal data-delay="2">
            <img src="https://images.unsplash.com/photo-1560769680-ba2f3767c785?w=700&q=85" alt="Huile de coco naturelle" className="lp-bio-img" />
            <img src="https://images.unsplash.com/photo-1671492246169-cdd6305870a0?w=400&q=85" alt="Huiles essentielles" className="lp-bio-img-sm" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CONFIANCE + NEWSLETTER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="lp-section lp-section-white" style={{ paddingBottom: 0 }}>
        <div className="lp-container">
          <div className="lp-trust-bar">
            {[
              { icon: 'fa-truck-fast',          title: 'Livraison Caraïbes',     sub: 'Martinique & Guadeloupe' },
              { icon: 'fa-lock',                title: 'Paiement sécurisé',      sub: 'Stripe — Données protégées' },
              { icon: 'fa-gem',                 title: 'Artisanat authentique',  sub: 'Sélection directe artisans' },
              { icon: 'fa-rotate-left',         title: 'Retours 14 jours',       sub: 'Échanges simplifiés' },
            ].map((t, i) => (
              <div key={t.title} className="lp-trust-item" data-reveal data-delay={i > 0 ? String(i) : undefined}>
                <i className={`fa-solid ${t.icon} lp-trust-icon`}></i>
                <div>
                  <strong className="lp-trust-title">{t.title}</strong>
                  <p className="lp-trust-sub">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="lp-newsletter">
        <div className="lp-newsletter-inner">
          <div className="lp-newsletter-left" data-reveal="slide-left">
            <p className="lp-eyebrow-light">Rejoignez-nous</p>
            <h3 className="lp-newsletter-title">Restez au cœur<br />de la <em>mode</em></h3>
            <p className="lp-newsletter-sub">Nouvelles collections et offres exclusives directement dans votre boîte mail.</p>
          </div>
          <div className="lp-newsletter-right" data-reveal data-delay="2">
            {newsSent ? (
              <div className="lp-newsletter-ok">
                <i className="fa-solid fa-circle-check"></i>
                <p>Merci ! Vous êtes inscrit(e).</p>
              </div>
            ) : (
              <form className="lp-newsletter-form" onSubmit={handleNewsletter}>
                <input type="email" placeholder="Votre adresse email…" value={newsEmail} onChange={e => setNewsEmail(e.target.value)} required />
                <button type="submit">
                  <i className="fa-solid fa-paper-plane me-2"></i>S'inscrire
                </button>
              </form>
            )}
            <p className="lp-newsletter-note">
              <i className="fa-solid fa-lock me-1"></i>Aucun spam. Désabonnement en un clic.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
