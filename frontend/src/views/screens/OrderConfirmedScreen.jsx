import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';

const STATUS_LABELS = {
  pending:    'En attente de paiement',
  paid:       'Payée',
  processing: 'En traitement',
  shipped:    'Expédiée',
  delivered:  'Livrée',
};

export default function OrderConfirmedScreen() {
  const { oid }           = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!oid) return;
    ordersAPI.detail(oid)
      .then(({ data }) => setOrder(data))
      .catch(() => {});
  }, [oid]);

  return (
    <div className="eth-confirm-page">
      <div className="eth-confirm-card" style={{ maxWidth: 580 }}>
        <div className="eth-confirm-icon-wrap eth-confirm-icon-success">
          <i className="fa-solid fa-circle-check"></i>
        </div>

        <h2 className="eth-confirm-title">Commande confirmée</h2>
        <p className="eth-confirm-sub">
          Merci pour votre confiance. Votre commande a bien été enregistrée
          et sera expédiée dans les meilleurs délais.
        </p>

        {order && (
          <>
            <div className="eth-confirm-ref">
              <i className="fa-solid fa-receipt" style={{ color: 'var(--tc-classic)' }}></i>
              <span>Référence :</span>
              <strong>{order.oid}</strong>
              <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--tc-dark)' }}>
                {formatPrice(order.total)}
              </span>
            </div>

            <div style={{ background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: '16px 20px', textAlign: 'left', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: 'var(--text-light)' }}>Statut</span>
                <span style={{ fontWeight: 700, color: 'var(--bio-main)' }}>
                  <i className="fa-solid fa-circle-check me-1"></i>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: 'var(--text-light)' }}>Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                  {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <i className="fa-solid fa-truck-fast" style={{ color: 'var(--tc-classic)', width: 16 }}></i>
                <span style={{ color: 'var(--text-mid)' }}>
                  Livraison estimée en <strong style={{ color: 'var(--text-dark)' }}>5 à 8 jours ouvrés</strong>
                </span>
              </div>
            </div>

            {order.items?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--sand)', paddingTop: 16, marginBottom: 8 }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-mid)', padding: '4px 0' }}>
                    <span>{item.product_name} <span style={{ color: 'var(--text-light)' }}>×{item.quantity}</span></span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="eth-confirm-actions">
          <Link to="/compte" className="btn-eth-outline" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-bag-shopping me-2"></i>Mes commandes
          </Link>
          <Link to="/" className="btn-eth-primary" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-house me-2"></i>Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
