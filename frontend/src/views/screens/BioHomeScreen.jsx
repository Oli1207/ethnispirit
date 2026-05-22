import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesAPI, productsAPI, newsletterAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import useCartStore from '../../store/cart';
import SEO from '../../components/SEO';

// ── Images Bio — huiles, soins naturels, plantes tropicales ───────────────────
const HERO_BG   = 'https://images.unsplash.com/photo-1595871522483-00a17611a5e3?w=1400&q=85'; // flacons huiles essentielles
const HERO_IMG2 = 'https://images.unsplash.com/photo-1560769680-ba2f3767c785?w=700&q=85';     // huile de coco naturelle
const HERO_IMG3 = 'https://images.unsplash.com/photo-1598779795578-2afceafed88e?w=700&q=85';  // beurre de karité + fleurs
const STORY_IMG = 'https://images.unsplash.com/photo-1638131163449-70059e10de6a?w=900&q=85';  // 3 pots soins naturels

const MARQUEE_ITEMS = [
  'Certifié Bio', 'Livraison Caraïbes', 'Sans Parabènes',
  'Commerce Équitable', '100% Naturel', 'Origine Tropicale',
  'Cruelty-Free', 'Ingrédients Purs', 'Formules Véganes',
];

const TESTIMONIALS = [
  { name: 'Véronique K.',      island: 'Martinique', stars: 5, text: 'L\'huile de coco est d\'une pureté incroyable. Ma peau est transformée en deux semaines. Je ne peux plus m\'en passer !' },
  { name: 'Olivia N.', island: 'Guadeloupe', stars: 5, text: 'Les tisanes sont délicieuses et vraiment efficaces. Emballage soigné, livraison rapide. Une boutique de confiance.' },
  { name: 'Emmanuella K.',    island: 'Martinique', stars: 5, text: 'Enfin des produits naturels de qualité livrés aux Caraïbes. Le soin visage est exceptionnel, résultats visibles dès la première semaine.' },
];

const BIO_CAT_IMGS = [
  'https://images.unsplash.com/photo-1573812461383-e5f8b759d12e?w=700&q=85',  // soins corps — crème karité
  'https://images.unsplash.com/photo-1671492246169-cdd6305870a0?w=700&q=85',  // huiles essentielles — 3 flacons
  'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=700&q=85',  // tisanes — tasse infusion
  'https://images.unsplash.com/photo-1676313779351-9648c6eaae8a?w=700&q=85',  // alimentaire bio — miel
];
const BIO_CAT_ICONS = ['fa-hand-holding-droplet', 'fa-bottle-droplet', 'fa-mug-hot', 'fa-apple-whole'];

function Stars({ n = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <i key={i} className={`fa-${i < n ? 'solid' : 'regular'} fa-star`}
           style={{ fontSize: 13, color: '#6AAF6A' }} />
      ))}
    </div>
  );
}

export default function BioHomeScreen() {
  const [categories, setCategories] = useState([]);
  const [featured,   setFeatured]   = useState([]);
  const [newsEmail,  setNewsEmail]  = useState('');
  const [newsSent,   setNewsSent]   = useState(false);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    categoriesAPI.list('bio').then(({ data }) => setCategories(data)).catch(() => {});
    productsAPI.list({ universe: 'bio', featured: '1' }).then(({ data }) => setFeatured(data.slice(0, 4))).catch(() => {});
  }, []);

  // ── Scroll reveal ─────────────────────────────────────────────────────────
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
    newsletterAPI.subscribe(newsEmail, 'bio').then(() => setNewsSent(true)).catch(() => {});
  }

  const cats = categories.length > 0 ? categories.slice(0, 4) : [
    { id: 1, name: 'Soins visage', slug: 'soins-visage', product_count: null },
    { id: 2, name: 'Huiles',       slug: 'huiles',       product_count: null },
    { id: 3, name: 'Tisanes',      slug: 'tisanes',      product_count: null },
    { id: 4, name: 'Alimentaire',  slug: 'alimentaire',  product_count: null },
  ];

  return (
    <>
      <SEO
        title="Bio & Naturel"
        description="Cosmétiques bio, huiles naturelles, tisanes et soins du corps inspirés des Caraïbes. 100% naturel, sans additifs. Livraison en Martinique, Guadeloupe et DOM-TOM."
        isHome={false}
      />

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="blp-hero">
        <div className="blp-hero-bg">
          <img src={HERO_BG} alt="" className="blp-hero-bg-img" />
          <div className="blp-hero-gradient" />
        </div>

        <div className="blp-hero-inner">
          <div className="blp-hero-left">
            <div className="blp-hero-eyebrow">
              <span className="blp-pulse" />
              Certifié Naturel &amp; Bio
            </div>
            <h1 className="blp-hero-h1">
              La Nature des<br />
              <em>Tropiques</em><br />
              <span className="blp-hero-h1-sub">à Votre Service</span>
            </h1>
            <p className="blp-hero-desc">
              Soins, huiles essentielles, tisanes et alimentaire bio<br className="d-none d-lg-block" />
              d'origine naturelle, livrés aux Caraïbes.
            </p>
            <div className="blp-hero-actions">
              <Link to="/bio/catalogue" className="blp-btn-main">
                <i className="fa-solid fa-leaf me-2" />
                Découvrir les produits
              </Link>
              <Link to="/" className="blp-btn-ghost">
                <i className="fa-solid fa-shirt me-2" />
                Univers Mode
              </Link>
            </div>
            <div className="blp-hero-stats">
              {[
                { val: '100%', lbl: 'Naturel' },
                { val: '4.9 ★', lbl: 'Note moyenne' },
                { val: 'Bio',  lbl: 'Certifié' },
              ].map(s => (
                <div key={s.lbl} className="blp-stat">
                  <div className="blp-stat-val">{s.val}</div>
                  <div className="blp-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="blp-hero-right">
            <div className="blp-hero-collage">
              <div className="blp-col-main">
                <img src={HERO_IMG2} alt="Soins naturels" />
                <div className="blp-col-tag">Soins</div>
              </div>
              <div className="blp-col-side">
                <div className="blp-col-sm">
                  <img src={HERO_IMG3} alt="Huiles" />
                  <div className="blp-col-tag sm">Huiles</div>
                </div>
                <div className="blp-col-badge">
                  <i className="fa-solid fa-certificate" />
                  <span>100% Bio Certifié</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="blp-scroll-hint">
          <div className="blp-scroll-mouse"><div className="blp-scroll-dot" /></div>
          <span>Défiler</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════════════════════════════ */}
      <div className="blp-marquee">
        <div className="blp-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="blp-marquee-item">
              {item} <span className="blp-marquee-sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CATÉGORIES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="blp-section blp-section-white">
        <div className="blp-container">
          <div className="blp-section-header" data-reveal>
            <div>
              <p className="blp-eyebrow">Explorer</p>
              <h2 className="blp-title">Nos <em>Gammes</em> Bio</h2>
            </div>
            <Link to="/bio/catalogue" className="blp-link-more">
              Tout voir <i className="fa-solid fa-arrow-right ms-1" />
            </Link>
          </div>

          <div className="blp-cat-grid">
            {cats.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/bio/catalogue?category=${cat.slug}`}
                className={`blp-cat-card blp-cat-${i}`}
                data-reveal
                data-delay={i > 0 ? String(i) : undefined}
              >
                <img src={cat.image || BIO_CAT_IMGS[i]} alt={cat.name} className="blp-cat-img" />
                <div className="blp-cat-overlay">
                  <div className="blp-cat-text">
                    <div className="blp-cat-icon"><i className={`fa-solid ${BIO_CAT_ICONS[i]}`} /></div>
                    <p className="blp-cat-sub">{cat.product_count ? `${cat.product_count} articles` : '—'}</p>
                    <h3 className="blp-cat-name">{cat.name}</h3>
                  </div>
                  <div className="blp-cat-arrow"><i className="fa-solid fa-arrow-right" /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRODUITS VEDETTES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="blp-section blp-section-cream">
        <div className="blp-container">
          <div className="blp-section-header" data-reveal>
            <div>
              <p className="blp-eyebrow">Sélection</p>
              <h2 className="blp-title">Nos coups de <em>cœur</em> bio</h2>
            </div>
            <Link to="/bio/catalogue" className="blp-link-more">
              Voir tout <i className="fa-solid fa-arrow-right ms-1" />
            </Link>
          </div>

          <div className="blp-products-grid">
            {(featured.length > 0
              ? featured
              : Array.from({ length: 4 }).map((_, i) => ({ id: i, _skeleton: true }))
            ).map((p, i) =>
              p._skeleton ? (
                <div key={i} className="blp-product-card blp-product-skeleton">
                  <div className="blp-product-img-wrap blp-skeleton-img" />
                  <div style={{ padding: '14px 0' }}>
                    <div className="blp-sk-line short" style={{ height: 10, marginBottom: 8 }} />
                    <div className="blp-sk-line" style={{ height: 14, marginBottom: 10 }} />
                    <div className="blp-sk-line short" style={{ height: 10 }} />
                  </div>
                </div>
              ) : (
                <div key={p.id} className="blp-product-card" data-reveal data-delay={i > 0 ? String(i) : undefined}>
                  <Link to={`/bio/produit/${p.slug}`} className="blp-product-img-wrap">
                    {p.main_image
                      ? <img src={p.main_image} alt={p.name} className="blp-product-img" />
                      : <div className="blp-product-img-ph"><i className="fa-solid fa-leaf" /></div>}
                    {p.discount_percent > 0 && <span className="blp-badge-disc">−{p.discount_percent}%</span>}
                    <div className="blp-product-actions">
                      <button
                        onClick={e => { e.preventDefault(); addItem(p.id, 1); }}
                        className="blp-quick-add"
                        disabled={!p.stock}
                      >
                        <i className="fa-solid fa-bag-shopping me-2" />
                        {p.stock ? 'Ajouter' : 'Rupture'}
                      </button>
                    </div>
                  </Link>
                  <div className="blp-product-body">
                    <p className="blp-product-cat">{p.category_name}</p>
                    <h6 className="blp-product-name">
                      <Link to={`/bio/produit/${p.slug}`}>{p.name}</Link>
                    </h6>
                    <div className="blp-product-footer">
                      <div>
                        <span className="blp-product-price">{formatPrice(p.price)}</span>
                        {p.old_price && <span className="blp-product-old ms-2">{formatPrice(p.old_price)}</span>}
                      </div>
                      {p.certification && <span className="blp-product-cert">{p.certification}</span>}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PROMESSE / HISTOIRE
      ══════════════════════════════════════════════════════════════════ */}
      <section className="blp-story">
        <div className="blp-story-inner">
          <div className="blp-story-visual" data-reveal="slide-left">
            <div className="blp-story-img-main">
              <img src={STORY_IMG} alt="Ingrédients naturels" />
            </div>
            <div className="blp-story-float-card">
              <i className="fa-solid fa-seedling" />
              <div>
                <strong>Ingrédients purs</strong>
                <span>Origine tropicale</span>
              </div>
            </div>
          </div>

          <div className="blp-story-content" data-reveal="slide-right">
            <p className="blp-eyebrow">Notre promesse</p>
            <h2 className="blp-title" style={{ textAlign: 'left' }}>
              Des ingrédients que<br />vous <em>pouvez prononcer</em>
            </h2>
            <p className="blp-story-text">
              Chaque produit est formulé avec des ingrédients naturels d'origine tropicale.
              Sans conservateurs artificiels, sans parabènes, sans perturbateurs endocriniens —
              juste la nature à l'état pur, livrée aux Caraïbes.
            </p>
            <div className="blp-story-pillars">
              {[
                { icon: 'fa-ban',    title: 'Zéro chimie',     desc: 'Sans parabènes, sulfates ni silicones' },
                { icon: 'fa-heart',  title: 'Cruelty-free',    desc: 'Formules véganes, non testées sur animaux' },
                { icon: 'fa-recycle', title: 'Éco-responsable', desc: 'Emballages recyclables, démarche durable' },
              ].map(pl => (
                <div key={pl.title} className="blp-pillar">
                  <div className="blp-pillar-icon"><i className={`fa-solid ${pl.icon}`} /></div>
                  <div>
                    <strong className="blp-pillar-title">{pl.title}</strong>
                    <p className="blp-pillar-desc">{pl.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/bio/catalogue" className="blp-btn-story">
              Voir nos produits <i className="fa-solid fa-arrow-right ms-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PROMO STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <div className="blp-promo-strip" data-reveal="fade">
        <i className="fa-solid fa-shield-halved" />
        <span>Satisfait ou remboursé :</span>
        <span className="blp-promo-code">30 jours</span>
        <span>— aucune question posée</span>
        <Link to="/bio/catalogue" className="blp-promo-cta">
          Découvrir <i className="fa-solid fa-arrow-right ms-1" />
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TÉMOIGNAGES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="blp-section blp-section-white">
        <div className="blp-container">
          <div className="blp-section-header" style={{ justifyContent: 'center', textAlign: 'center' }} data-reveal="fade">
            <div>
              <p className="blp-eyebrow">Avis clients</p>
              <h2 className="blp-title">Elles nous font <em>confiance</em></h2>
            </div>
          </div>
          <div className="blp-reviews-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="blp-review-card" data-reveal data-delay={i > 0 ? String(i) : undefined}>
                <Stars n={t.stars} />
                <p className="blp-review-text">"{t.text}"</p>
                <div className="blp-review-author">
                  <div className="blp-review-avatar">{t.name[0]}</div>
                  <div>
                    <strong className="blp-review-name">{t.name}</strong>
                    <span className="blp-review-island">
                      <i className="fa-solid fa-location-dot me-1" />{t.island}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          MODE TEASER — invitation vers l'autre univers
      ══════════════════════════════════════════════════════════════════ */}
      <section className="blp-mode-teaser">
        <div className="blp-mode-inner">
          <div className="blp-mode-content" data-reveal="slide-left">
            <div className="blp-mode-badge">
              <i className="fa-solid fa-sparkles me-2" />Découvrir aussi
            </div>
            <h2 className="blp-mode-title">
              EthniSpirit<br /><em>Mode &amp; Bijoux</em>
            </h2>
            <p className="blp-mode-desc">
              Bijoux, tenues et accessoires d'origine ivoirienne,
              soigneusement sélectionnés pour la femme antillaise.
            </p>
            <div className="blp-mode-feats">
              {['Artisanat Ivoirien', 'Pièces Uniques', 'Livraison Caraïbes'].map(f => (
                <span key={f} className="blp-mode-feat">
                  <i className="fa-solid fa-check me-2" />{f}
                </span>
              ))}
            </div>
            <Link to="/" className="blp-btn-mode">
              Explorer l'univers Mode <i className="fa-solid fa-arrow-right ms-2" />
            </Link>
          </div>
          <div className="blp-mode-visual" data-reveal data-delay="2">
            <img src="https://images.unsplash.com/photo-1664151099399-d41ed991a10d?w=700&q=85" alt="Mode africaine" className="blp-mode-img" />
            <img src="https://images.unsplash.com/photo-1757140448448-90ed1f18fcbb?w=400&q=85" alt="Bijoux africains" className="blp-mode-img-sm" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST BAR + NEWSLETTER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="blp-section blp-section-white" style={{ paddingBottom: 0 }}>
        <div className="blp-container">
          <div className="blp-trust-bar">
            {[
              { icon: 'fa-leaf',        title: '100% Naturel',       sub: 'Ingrédients d\'origine végétale' },
              { icon: 'fa-lock',        title: 'Paiement sécurisé',  sub: 'Stripe — Données protégées' },
              { icon: 'fa-truck-fast',  title: 'Livraison aux Caraïbes', sub: 'Martinique & Guadeloupe' },
              { icon: 'fa-rotate-left', title: 'Retours 30 jours',   sub: 'Satisfait ou remboursé' },
            ].map((t, i) => (
              <div key={t.title} className="blp-trust-item" data-reveal data-delay={i > 0 ? String(i) : undefined}>
                <i className={`fa-solid ${t.icon} blp-trust-icon`} />
                <div>
                  <strong className="blp-trust-title">{t.title}</strong>
                  <p className="blp-trust-sub">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="blp-newsletter">
        <div className="blp-newsletter-inner">
          <div className="blp-newsletter-left" data-reveal="slide-left">
            <p className="blp-eyebrow-light">Rejoignez-nous</p>
            <h3 className="blp-newsletter-title">Bien-être &amp; nature<br />dans votre <em>boîte mail</em></h3>
            <p className="blp-newsletter-sub">Recettes naturelles, conseils bien-être et offres exclusives.</p>
          </div>
          <div className="blp-newsletter-right" data-reveal data-delay="2">
            {newsSent ? (
              <div className="blp-newsletter-ok">
                <i className="fa-solid fa-circle-check" />
                <p>Merci ! Vous êtes inscrit(e).</p>
              </div>
            ) : (
              <form className="blp-newsletter-form" onSubmit={handleNewsletter}>
                <input type="email" placeholder="Votre adresse email…" value={newsEmail} onChange={e => setNewsEmail(e.target.value)} required />
                <button type="submit">
                  <i className="fa-solid fa-leaf me-2" />S'inscrire
                </button>
              </form>
            )}
            <p className="blp-newsletter-note">
              <i className="fa-solid fa-lock me-1" />Aucun spam. Désabonnement en un clic.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
