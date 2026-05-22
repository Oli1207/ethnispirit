const SECTIONS = [
  {
    icon: 'fa-database',
    title: '1. Données collectées',
    text: `Lors de vos achats et de votre inscription, nous collectons : nom, prénom, adresse email, adresse de livraison, numéro de téléphone. Ces données sont nécessaires au traitement de vos commandes et à la gestion de votre compte.`,
  },
  {
    icon: 'fa-chart-bar',
    title: '2. Utilisation des données',
    text: `Vos données sont utilisées exclusivement pour : traiter et livrer vos commandes, vous envoyer des confirmations et mises à jour de commandes, améliorer nos services. Nous ne revendons jamais vos données personnelles à des tiers.`,
  },
  {
    icon: 'fa-credit-card',
    title: '3. Paiement',
    text: `Les paiements sont traités par Stripe, certifié PCI-DSS niveau 1. Nous ne stockons aucune donnée bancaire sur nos serveurs. Toutes les transactions sont chiffrées via SSL/TLS et sécurisées par l'authentification forte 3D Secure 2.`,
  },
  {
    icon: 'fa-cookie-bite',
    title: '4. Cookies',
    text: `Nous utilisons uniquement des cookies techniques (authentification JWT, panier) indispensables au bon fonctionnement du site. Aucun cookie publicitaire ou de suivi tiers n'est utilisé.`,
  },
  {
    icon: 'fa-user-shield',
    title: '5. Vos droits (RGPD)',
    text: `Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à contact@ethnispirit.fr.`,
  },
  {
    icon: 'fa-envelope',
    title: '6. Contact',
    text: `Pour toute question relative à la protection de vos données personnelles : EthniSpirit — contact@ethnispirit.fr`,
  },
];

export default function PolicyScreen() {
  return (
    <div style={{ background: 'var(--cream)' }}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Légal</p>
            <h1 className="eth-section-title">Politique de <em>confidentialité</em></h1>
            <p className="eth-section-sub mt-1">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="eth-page-body" style={{ maxWidth: 760 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              style={{
                background: '#fff', borderRadius: 'var(--r-lg)',
                border: '1px solid var(--sand)', padding: '24px 28px',
              }}
            >
              <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: 'var(--tc-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className={`fa-solid ${section.icon}`} style={{ color: 'var(--tc-classic)', fontSize: 14 }}></i>
                </div>
                <h5 style={{
                  fontFamily: 'Playfair Display, serif', fontSize: 17,
                  color: 'var(--text-dark)', margin: '4px 0 0',
                }}>
                  {section.title}
                </h5>
              </div>
              <p style={{
                color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.7,
                margin: 0, paddingLeft: 52,
              }}>
                {section.text}
              </p>
            </div>
          ))}
        </div>

        {/* RGPD note */}
        <div style={{
          background: 'var(--tc-light)', border: '1px solid rgba(198,93,59,.2)',
          borderRadius: 'var(--r-md)', padding: '16px 20px', marginTop: 24,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <i className="fa-solid fa-scale-balanced" style={{ color: 'var(--tc-classic)', fontSize: 16, marginTop: 2, flexShrink: 0 }}></i>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>
            EthniSpirit s'engage à protéger votre vie privée et à se conformer au RGPD en vigueur dans l'Union Européenne. Pour toute réclamation, vous pouvez également contacter la{' '}
            <strong style={{ color: 'var(--text-dark)' }}>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés).
          </p>
        </div>

      </div>
    </div>
  );
}
