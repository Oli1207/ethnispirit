import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

const ZONES = [
  { destination: 'Martinique',       delai: '5 – 8 jours ouvrés',   mode: 'Colissimo / Chronopost' },
  { destination: 'Guadeloupe',       delai: '5 – 8 jours ouvrés',   mode: 'Colissimo / Chronopost' },
  { destination: 'Saint-Martin',     delai: '7 – 12 jours ouvrés',  mode: 'Colissimo' },
  { destination: 'Saint-Barthélemy', delai: '7 – 12 jours ouvrés',  mode: 'Colissimo' },
];

export default function LivraisonScreen() {
  return (
    <div style={{ background: 'var(--cream)' }}>
      <SEO
        title="Livraison & Délais"
        description="Informations de livraison EthniSpirit : zones, délais et tarifs pour la Martinique, la Guadeloupe, la Réunion et toute la France."
      />
      <MobileBackButton to="/" label="Accueil" />
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Informations pratiques</p>
            <h1 className="eth-section-title">Livraison & <em>délais</em></h1>
            <p className="eth-section-sub mt-1">Tout savoir sur nos zones et délais de livraison.</p>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="eth-page-body" style={{ maxWidth: 860 }}>

        {/* 3 info cards */}
        <div className="eth-livraison-cards">
          {[
            {
              icon: 'fa-map-location-dot',
              title: 'Zones de livraison',
              text: 'Nous livrons en Martinique, Guadeloupe, Saint-Martin et Saint-Barthélemy. Les commandes sont expédiées depuis la France métropolitaine.',
            },
            {
              icon: 'fa-clock',
              title: 'Délais de livraison',
              text: 'Comptez 5 à 8 jours ouvrés après validation du paiement. En période de forte demande (Noël, fêtes), prévoir 2 à 3 jours supplémentaires.',
            },
            {
              icon: 'fa-receipt',
              title: 'Frais de livraison',
              text: 'Les frais sont calculés selon le poids et la destination. Ils sont indiqués clairement avant la validation de votre commande.',
            },
          ].map((item) => (
            <div key={item.icon} style={{
              background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)',
              padding: '28px 24px',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'var(--tc-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: 'var(--tc-classic)', fontSize: 18 }}></i>
              </div>
              <h5 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--text-dark)', marginBottom: 8 }}>
                {item.title}
              </h5>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* Tableau */}
        <div style={{
          background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)',
          overflow: 'hidden', marginTop: 32,
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid var(--sand)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <i className="fa-solid fa-table-list" style={{ color: 'var(--tc-classic)' }}></i>
            <h5 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--text-dark)', margin: 0 }}>
              Délais estimés par destination
            </h5>
          </div>
          <div className="table-responsive">
            <table className="table eth-admin-table mb-0">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Délai estimé</th>
                  <th>Mode d'expédition</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => (
                  <tr key={z.destination}>
                    <td>
                      <i className="fa-solid fa-location-dot me-2" style={{ color: 'var(--tc-classic)', fontSize: 12 }}></i>
                      <strong>{z.destination}</strong>
                    </td>
                    <td>
                      <span style={{
                        background: 'var(--tc-light)', color: 'var(--tc-dark)',
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      }}>
                        {z.delai}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-mid)', fontSize: 13 }}>{z.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info note */}
        <div style={{
          background: 'var(--tc-light)', border: '1px solid rgba(198,93,59,.2)',
          borderRadius: 'var(--r-md)', padding: '16px 20px', marginTop: 24,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <i className="fa-solid fa-circle-info" style={{ color: 'var(--tc-classic)', fontSize: 16, marginTop: 2, flexShrink: 0 }}></i>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>
            En cas de retard ou de problème de livraison, contactez-nous à{' '}
            <strong style={{ color: 'var(--text-dark)' }}>support@ethnispirit.com</strong>{' '}
            en mentionnant votre numéro de commande. Nous répondons sous 24 h ouvrées.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/contact" className="btn-eth-outline" style={{ padding: '11px 28px', marginRight: 12 }}>
            <i className="fa-solid fa-envelope me-2"></i>Nous contacter
          </Link>
          <Link to="/catalogue" className="btn-eth-primary" style={{ padding: '11px 28px' }}>
            <i className="fa-solid fa-arrow-right me-2"></i>Voir le catalogue
          </Link>
        </div>

      </div>
    </div>
  );
}
