import { Link } from 'react-router-dom';

export default function PaymentFailedScreen() {
  return (
    <div className="eth-confirm-page">
      <div className="eth-confirm-card">
        <div className="eth-confirm-icon-wrap eth-confirm-icon-fail">
          <i className="fa-solid fa-circle-xmark"></i>
        </div>

        <h2 className="eth-confirm-title">Paiement non abouti</h2>
        <p className="eth-confirm-sub">
          Votre paiement n'a pas pu être traité. Aucun montant n'a été débité.
          Veuillez réessayer ou contacter notre support.
        </p>

        <div style={{ background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: '16px 20px', textAlign: 'left', margin: '20px 0' }}>
          {[
            { icon: 'fa-credit-card',           text: 'Vérifiez les informations de votre carte' },
            { icon: 'fa-wifi',                  text: 'Vérifiez votre connexion internet' },
            { icon: 'fa-phone',                 text: 'Contactez votre banque si le problème persiste' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-mid)', marginBottom: i < 2 ? 10 : 0 }}>
              <i className={`fa-solid ${item.icon}`} style={{ color: 'var(--tc-classic)', width: 16 }}></i>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <div className="eth-confirm-actions">
          <Link to="/panier" className="btn-eth-primary" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-rotate-left me-2"></i>Réessayer
          </Link>
          <Link to="/contact" className="btn-eth-outline" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-headset me-2"></i>Support
          </Link>
        </div>
      </div>
    </div>
  );
}
