import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

const FAQS = [
  {
    category: 'Livraison',
    icon: 'fa-truck-fast',
    items: [
      {
        q: 'Livrez-vous en Martinique et en Guadeloupe ?',
        a: 'Oui, nous livrons dans toute la Martinique et la Guadeloupe. Les délais de livraison sont généralement de 5 à 8 jours ouvrés après validation du paiement.',
      },
      {
        q: 'Quels sont les frais de livraison ?',
        a: 'Les frais de livraison sont calculés selon le poids et la destination. Ils sont affichés clairement avant la confirmation de votre commande.',
      },
    ],
  },
  {
    category: 'Paiement',
    icon: 'fa-credit-card',
    items: [
      {
        q: 'Comment puis-je payer ?',
        a: 'Nous acceptons les paiements par carte bancaire (Visa, Mastercard), Apple Pay et Google Pay via notre partenaire sécurisé Stripe. Vos données bancaires ne sont jamais stockées sur notre site.',
      },
      {
        q: 'Mon paiement est-il sécurisé ?',
        a: 'Absolument. Stripe est certifié PCI-DSS niveau 1 (le plus élevé). Toutes les transactions sont chiffrées via SSL/TLS et protégées par l\'authentification forte 3D Secure 2.',
      },
    ],
  },
  {
    category: 'Produits',
    icon: 'fa-gem',
    items: [
      {
        q: 'Les produits sont-ils authentiquement ivoiriens ?',
        a: 'Oui. Tous nos articles de mode proviennent directement d\'artisans et créateurs de Côte d\'Ivoire, avec lesquels nous travaillons en partenariat direct et éthique.',
      },
      {
        q: 'Les produits bio sont-ils certifiés ?',
        a: 'Nos produits bio sont sélectionnés pour leur naturalité. Chaque fiche produit précise le type de certification ou la mention "Naturel" selon le cas.',
      },
    ],
  },
  {
    category: 'Commandes & Retours',
    icon: 'fa-rotate-left',
    items: [
      {
        q: 'Puis-je retourner un article ?',
        a: 'Oui, vous disposez de 14 jours après réception pour retourner un article en parfait état dans son emballage d\'origine. Contactez-nous à contact@ethnispirit.fr pour initier un retour.',
      },
      {
        q: 'Comment suivre ma commande ?',
        a: 'Après expédition, vous recevez un email avec votre numéro de suivi. Vous pouvez également consulter l\'état de vos commandes dans votre espace compte.',
      },
      {
        q: 'Puis-je commander sans créer de compte ?',
        a: 'Oui, vous pouvez passer commande en tant qu\'invité. Créer un compte vous permet néanmoins de suivre vos commandes et d\'accéder à votre historique d\'achats.',
      },
    ],
  },
];

export default function FAQScreen() {
  const [openMap, setOpenMap] = useState({ '0-0': true });

  function toggleItem(key) {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // JSON-LD FAQ Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.flatMap(cat =>
      cat.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      }))
    ),
  };

  return (
    <div style={{ background: 'var(--cream)' }}>
      <SEO
        title="Questions fréquentes"
        description="Toutes les réponses à vos questions sur EthniSpirit : livraison, retours, paiement, produits bio, suivi de commande."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <MobileBackButton to="/" label="Accueil" />
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Aide</p>
            <h1 className="eth-section-title">Questions <em>fréquentes</em></h1>
            <p className="eth-section-sub mt-1">Tout ce que vous devez savoir sur EthniSpirit.</p>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="eth-page-body" style={{ maxWidth: 760 }}>

        {FAQS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 40 }}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--tc-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`fa-solid ${group.icon}`} style={{ color: 'var(--tc-classic)', fontSize: 14 }}></i>
              </div>
              <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: 'var(--text-dark)', margin: 0 }}>
                {group.category}
              </h4>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map((faq, ii) => {
                const key  = `${gi}-${ii}`;
                const open = !!openMap[key];
                return (
                  <div
                    key={ii}
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--r-md)',
                      border: `1px solid ${open ? 'var(--tc-classic)' : 'var(--sand)'}`,
                      overflow: 'hidden',
                      transition: 'border-color .2s',
                    }}
                  >
                    <button
                      onClick={() => toggleItem(key)}
                      style={{
                        width: '100%', textAlign: 'left', background: 'none', border: 'none',
                        padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: 12, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
                        color: 'var(--text-dark)',
                      }}
                    >
                      <span>{faq.q}</span>
                      <i
                        className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`}
                        style={{ color: 'var(--tc-classic)', fontSize: 12, flexShrink: 0, transition: 'transform .2s' }}
                      ></i>
                    </button>
                    {open && (
                      <div style={{
                        padding: '0 20px 18px',
                        fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.65,
                        borderTop: '1px solid var(--sand)',
                        paddingTop: 14,
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div style={{
          background: '#fff', border: '1px solid var(--sand)', borderRadius: 'var(--r-lg)',
          padding: '32px', textAlign: 'center', marginTop: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'var(--tc-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <i className="fa-solid fa-headset" style={{ color: 'var(--tc-classic)', fontSize: 20 }}></i>
          </div>
          <h5 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: 'var(--text-dark)', marginBottom: 8 }}>
            Vous n'avez pas trouvé votre réponse ?
          </h5>
          <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 20 }}>
            Notre équipe répond sous 24 h ouvrées.
          </p>
          <Link to="/contact" className="btn-eth-primary" style={{ padding: '11px 28px' }}>
            <i className="fa-solid fa-envelope me-2"></i>Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
