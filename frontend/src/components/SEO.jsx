/**
 * SEO.jsx — Composant universel de gestion des méta-données
 *
 * Usage basique :
 *   <SEO title="Catalogue" description="..." />
 *
 * Usage produit :
 *   <SEO
 *     title={product.name}
 *     description={product.description}
 *     image={product.main_image}
 *     type="product"
 *     product={product}
 *     breadcrumbs={[{ name:'Accueil', url:'/' }, { name:'Bijoux', url:'/catalogue?category=bijoux' }]}
 *   />
 */
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_NAME   = 'EthniSpirit';
const SITE_URL    = import.meta.env.VITE_SITE_URL || 'https://ethnispirit.fr';
const DEFAULT_IMG = `${SITE_URL}/icons/og-default.png`;
const DEFAULT_DESC = 'Mode antillaise authentique & cosmétiques bio naturels. Bijoux, vêtements, soins — livraison en Martinique, Guadeloupe et DOM-TOM.';

export default function SEO({
  title,
  description = DEFAULT_DESC,
  image,
  type        = 'website',
  noindex     = false,
  product     = null,   // objet produit complet pour JSON-LD Product
  breadcrumbs = null,   // [{ name, url }] pour BreadcrumbList
  isHome      = false,  // active JSON-LD WebSite + SearchAction
}) {
  const location  = useLocation();
  const canonical = `${SITE_URL}${location.pathname}`;
  const ogImage   = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : DEFAULT_IMG;

  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Mode Antillaise & Bio Naturel`;

  // ── JSON-LD : WebSite + SearchAction (homepage) ───────────────────────────
  const websiteSchema = isHome ? {
    '@context':    'https://schema.org',
    '@type':       'WebSite',
    name:          SITE_NAME,
    url:           SITE_URL,
    description:   DEFAULT_DESC,
    inLanguage:    'fr-FR',
    potentialAction: {
      '@type':       'SearchAction',
      target:        `${SITE_URL}/catalogue?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  } : null;

  // ── JSON-LD : Organization (homepage) ────────────────────────────────────
  const orgSchema = isHome ? {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    name:       SITE_NAME,
    url:        SITE_URL,
    logo:       `${SITE_URL}/icons/icon-512.png`,
    contactPoint: {
      '@type':       'ContactPoint',
      contactType:   'customer service',
      availableLanguage: 'French',
      url:           `${SITE_URL}/contact`,
    },
    sameAs: [
      'https://www.instagram.com/ethnispirit',
      'https://www.facebook.com/ethnispirit',
    ],
  } : null;

  // ── JSON-LD : Product ─────────────────────────────────────────────────────
  const productSchema = product ? {
    '@context':   'https://schema.org',
    '@type':      'Product',
    name:         product.name,
    description:  product.description || description,
    image:        ogImage,
    url:          canonical,
    sku:          product.uid || product.id,
    brand: {
      '@type': 'Brand',
      name:    SITE_NAME,
    },
    offers: {
      '@type':           'Offer',
      priceCurrency:     'EUR',
      price:             product.price,
      availability:      product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url:               canonical,
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
    ...(product.avg_rating ? {
      aggregateRating: {
        '@type':       'AggregateRating',
        ratingValue:   product.avg_rating,
        reviewCount:   product.review_count || 1,
        bestRating:    5,
        worstRating:   1,
      },
    } : {}),
  } : null;

  // ── JSON-LD : BreadcrumbList ───────────────────────────────────────────────
  const breadcrumbSchema = breadcrumbs ? {
    '@context':  'https://schema.org',
    '@type':     'BreadcrumbList',
    itemListElement: breadcrumbs.map((bc, i) => ({
      '@type':  'ListItem',
      position: i + 1,
      name:     bc.name,
      item:     bc.url.startsWith('http') ? bc.url : `${SITE_URL}${bc.url}`,
    })),
  } : null;

  return (
    <Helmet>
      {/* ── Titre & description ──────────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical} />

      {/* ── Open Graph ───────────────────────────────────────────────────── */}
      <meta property="og:type"         content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:title"        content={fullTitle} />
      <meta property="og:description"  content={description} />
      <meta property="og:image"        content={ogImage} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content={type === 'product' ? '1200' : '630'} />
      <meta property="og:url"          content={canonical} />
      <meta property="og:site_name"    content={SITE_NAME} />
      <meta property="og:locale"       content="fr_FR" />
      {type === 'product' && product && (
        <meta property="product:price:amount"   content={product.price} />
      )}
      {type === 'product' && product && (
        <meta property="product:price:currency" content="EUR" />
      )}

      {/* ── Twitter Card ─────────────────────────────────────────────────── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage} />

      {/* ── JSON-LD ───────────────────────────────────────────────────────── */}
      {websiteSchema && (
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      )}
      {orgSchema && (
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>
      )}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
}
