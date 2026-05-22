import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categoriesAPI, productsAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import useCartStore from '../../store/cart';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

export default function CatalogueScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories]     = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState(searchParams.get('search') || '');
  const activeCategory                  = searchParams.get('category') || '';
  const addItem                         = useCartStore((s) => s.addItem);

  // ── Filtres frontend ────────────────────────────────────────────────────
  const [sortBy, setSortBy]               = useState('');
  const [inStockOnly, setInStockOnly]     = useState(false);
  const [activeCert, setActiveCert]       = useState('');

  useEffect(() => {
    categoriesAPI.list('mode')
      .then(({ data }) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { universe: 'mode' };
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

  const catLabel = activeCategory
    ? categories.find(c => c.slug === activeCategory)?.name
    : null;

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
    // 'recent' = default order from API
    return list;
  })();

  return (
    <div className="eth-catalogue-page">
      <SEO
        title={catLabel ? `${catLabel} — Mode Antillaise` : 'Catalogue Mode Antillaise'}
        description="Découvrez notre collection de bijoux, vêtements et accessoires antillais et africains. Pièces uniques, artisanat authentique, livraison en DOM-TOM."
        breadcrumbs={[
          { name: 'Accueil', url: '/' },
          { name: 'Catalogue', url: '/catalogue' },
          ...(catLabel ? [{ name: catLabel, url: `/catalogue?category=${activeCategory}` }] : []),
        ]}
      />
      <MobileBackButton to="/" label="Accueil" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="eth-catalogue-header">
        <div className="eth-catalogue-header-inner">
          <div>
            <p className="eth-section-label">Mode Antillaise</p>
            <h1 className="eth-section-title">Notre <em>Catalogue</em></h1>
            <p className="eth-section-sub mt-2">
              {products.length > 0 ? `${products.length} article${products.length > 1 ? 's' : ''} disponibles` : 'Découvrez tous nos produits'}
            </p>
          </div>
          <nav aria-label="breadcrumb" className="d-none d-md-block">
            <ol className="breadcrumb eth-breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
              <li className="breadcrumb-item active">Catalogue</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="eth-catalogue-filters-bar">
        <div className="eth-catalogue-filters-inner">
          <div className="eth-filters-chips">
            <button
              className={`eth-filter-btn ${!activeCategory ? 'active' : ''}`}
              onClick={() => handleCategoryClick('')}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`eth-filter-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <form className="eth-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </form>
        </div>
        {/* ── Barre de filtres secondaires ────────────────────────────── */}
        <div className="eth-secondary-filters">
          <select
            className="eth-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="popular">Populaires</option>
          </select>
          <label className="eth-instock-toggle">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            En stock seulement
          </label>
          {certifications.length > 0 && (
            <div className="eth-cert-chips">
              {certifications.map((cert) => (
                <button
                  key={cert}
                  className={`eth-cert-chip ${activeCert === cert ? 'active' : ''}`}
                  onClick={() => setActiveCert(activeCert === cert ? '' : cert)}
                >
                  <i className="fa-solid fa-leaf me-1"></i>{cert}
                </button>
              ))}
            </div>
          )}
          {hasActiveFilters && (
            <button
              className="eth-reset-filters"
              onClick={() => { setSortBy(''); setInStockOnly(false); setActiveCert(''); }}
            >
              <i className="fa-solid fa-xmark me-1"></i>Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div className="eth-catalogue-body">
        {loading ? (
          <div className="eth-catalogue-loading">
            <div className="spinner-border eth-spinner" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="eth-catalogue-empty">
            <i className="fa-solid fa-box-open fa-3x mb-3"></i>
            <h5>Aucun produit trouvé</h5>
            <p>Essayez une autre catégorie ou modifiez votre recherche.</p>
            <button className="eth-filter-btn active mt-3" onClick={() => { handleCategoryClick(''); setSearch(''); setSortBy(''); setInStockOnly(false); setActiveCert(''); }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="eth-products-grid">
            {displayedProducts.map((product) => (
              <div className="eth-product-card" key={product.id}>
                <Link to={`/produit/${product.slug}`}>
                  <div className="eth-product-img-wrap">
                    {product.main_image ? (
                      <img src={product.main_image} alt={product.name} className="eth-product-img" />
                    ) : (
                      <div className="eth-product-img-placeholder">
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                    {product.discount_percent > 0 && (
                      <span className="eth-badge-discount">-{product.discount_percent}%</span>
                    )}
                  </div>
                </Link>
                <div className="eth-product-body">
                  <p className="eth-product-cat">{product.category_name}</p>
                  <h6 className="eth-product-name">
                    <Link to={`/produit/${product.slug}`}>{product.name}</Link>
                  </h6>
                  <div className="eth-product-footer">
                    <div>
                      <span className="eth-product-price">{formatPrice(product.price)}</span>
                      {product.old_price && (
                        <span className="eth-product-old-price ms-1">{formatPrice(product.old_price)}</span>
                      )}
                    </div>
                    <button
                      className="eth-btn-cart"
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
