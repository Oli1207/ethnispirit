import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categoriesAPI, productsAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import useCartStore from '../../store/cart';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

export default function BioCatalogueScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories]     = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState(searchParams.get('search') || '');
  const activeCategory                  = searchParams.get('category') || '';
  const addItem                         = useCartStore((s) => s.addItem);

  // ── Filtres frontend ────────────────────────────────────────────────────
  const [sortBy, setSortBy]           = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeCert, setActiveCert]   = useState('');

  useEffect(() => {
    categoriesAPI.list('bio')
      .then(({ data }) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { universe: 'bio' };
    if (activeCategory) params.category = activeCategory;
    if (search)         params.search   = search;
    productsAPI.list(params)
      .then(({ data }) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeCategory, search]);

  function handleCategoryClick(slug) {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('category', slug); else next.delete('category');
    setSearchParams(next);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (search) next.set('search', search); else next.delete('search');
    setSearchParams(next);
  }

  // Certifications uniques
  const certifications = [...new Set(products.map(p => p.certification).filter(Boolean))];

  // Produits filtrés + triés
  const hasActiveFilters = sortBy || inStockOnly || activeCert;
  const displayedProducts = (() => {
    let list = [...products];
    if (inStockOnly)  list = list.filter(p => p.stock > 0);
    if (activeCert)   list = list.filter(p => p.certification === activeCert);
    if (sortBy === 'price_asc')  list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === 'price_desc') list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === 'popular')    list.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
    return list;
  })();

  return (
    <div className="bio-catalogue-page">
      <SEO
        title="Catalogue Bio & Naturel"
        description="Soins naturels, huiles essentielles, tisanes et cosmétiques bio caribéens. Certifié naturel, sans additifs. Livraison en Martinique, Guadeloupe et DOM-TOM."
        breadcrumbs={[{ name: 'Accueil Bio', url: '/bio' }, { name: 'Catalogue Bio', url: '/bio/catalogue' }]}
      />
      <MobileBackButton to="/bio" label="Accueil Bio" />
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bio-catalogue-header">
        <div className="bio-catalogue-header-inner">
          <div>
            <p className="bio-section-label">Bio &amp; Naturel</p>
            <h1 className="bio-section-title">
              <i className="fa-solid fa-leaf me-2"></i>Catalogue <em>Bio</em>
            </h1>
            <p className="bio-section-sub mt-2">
              {products.length > 0 ? `${products.length} produit${products.length > 1 ? 's' : ''} naturels` : 'Découvrez tous nos produits bio'}
            </p>
          </div>
          <nav aria-label="breadcrumb" className="d-none d-md-block">
            <ol className="breadcrumb bio-breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/bio">Accueil Bio</Link></li>
              <li className="breadcrumb-item active">Catalogue</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="bio-catalogue-filters-bar">
        <div className="bio-catalogue-filters-inner">
          <div className="bio-filters-chips">
            <button
              className={`bio-filter-btn ${!activeCategory ? 'active' : ''}`}
              onClick={() => handleCategoryClick('')}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`bio-filter-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <form className="bio-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="Rechercher un produit bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </form>
        </div>
        {/* ── Barre de filtres secondaires ────────────────────────────── */}
        <div className="bio-secondary-filters">
          <select
            className="bio-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="popular">Populaires</option>
          </select>
          <label className="bio-instock-toggle">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            En stock seulement
          </label>
          {certifications.length > 0 && (
            <div className="bio-cert-chips">
              {certifications.map((cert) => (
                <button
                  key={cert}
                  className={`bio-cert-chip ${activeCert === cert ? 'active' : ''}`}
                  onClick={() => setActiveCert(activeCert === cert ? '' : cert)}
                >
                  <i className="fa-solid fa-leaf me-1"></i>{cert}
                </button>
              ))}
            </div>
          )}
          {hasActiveFilters && (
            <button
              className="bio-reset-filters"
              onClick={() => { setSortBy(''); setInStockOnly(false); setActiveCert(''); }}
            >
              <i className="fa-solid fa-xmark me-1"></i>Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div className="bio-catalogue-body">
        {loading ? (
          <div className="bio-catalogue-loading">
            <div className="spinner-border bio-spinner" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="bio-catalogue-empty">
            <i className="fa-solid fa-leaf fa-3x mb-3" style={{ color: 'var(--bio-pale)' }}></i>
            <h5>Aucun produit trouvé</h5>
            <p>Essayez une autre catégorie ou modifiez votre recherche.</p>
            <button className="bio-filter-btn active mt-3" onClick={() => { handleCategoryClick(''); setSearch(''); setSortBy(''); setInStockOnly(false); setActiveCert(''); }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="bio-products-grid">
            {displayedProducts.map((product) => (
              <div className="bio-product-card" key={product.id}>
                <Link to={`/bio/produit/${product.slug}`}>
                  <div className="bio-product-img-wrap">
                    {product.main_image ? (
                      <img src={product.main_image} alt={product.name} className="bio-product-img" />
                    ) : (
                      <div className="bio-product-img-placeholder">
                        <i className="fa-solid fa-leaf"></i>
                      </div>
                    )}
                    {product.discount_percent > 0 && (
                      <span className="bio-badge-discount">-{product.discount_percent}%</span>
                    )}
                  </div>
                </Link>
                <div className="bio-product-body">
                  <p className="bio-product-cat">{product.category_name}</p>
                  <h6 className="bio-product-name">
                    <Link to={`/bio/produit/${product.slug}`}>{product.name}</Link>
                  </h6>
                  <div className="bio-product-footer">
                    <div>
                      <span className="bio-product-price">{formatPrice(product.price)}</span>
                      {product.old_price && (
                        <span className="bio-product-old-price ms-1">{formatPrice(product.old_price)}</span>
                      )}
                    </div>
                    <button
                      className="bio-btn-cart"
                      onClick={() => addItem(product.id, 1)}
                      disabled={product.stock === 0}
                      title="Ajouter au panier"
                    >
                      <i className="fa-solid fa-bag-shopping"></i>
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
