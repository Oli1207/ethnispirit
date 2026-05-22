import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ordersAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import { trackEventStandalone } from '../../hooks/useTracking';

export default function PaymentSuccessScreen() {
  const [searchParams]        = useSearchParams();
  const oid                   = searchParams.get('oid');
  const sessionId             = searchParams.get('session_id');
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyErr, setVerifyErr] = useState('');

  useEffect(() => {
    if (!oid || !sessionId) { setLoading(false); return; }
    // Léger délai pour laisser Stripe finaliser côté serveur
    const timer = setTimeout(() => {
      ordersAPI.verify(oid, sessionId)
        .then(({ data }) => {
          setOrder(data);
          trackEventStandalone('purchase', {
            order_oid: data.oid,
            value:     parseFloat(data.total),
          });
        })
        .catch((err) => {
          const msg = err.response?.data?.error || 'Impossible de vérifier le paiement.';
          setVerifyErr(msg);
        })
        .finally(() => setLoading(false));
    }, 800);
    return () => clearTimeout(timer);
  }, [oid, sessionId]);

  return (
    <div className="eth-confirm-page">
      <div className="eth-confirm-card">

        {/* Icône succès */}
        <div className="eth-confirm-icon-wrap eth-confirm-icon-success">
          <i className="fa-solid fa-circle-check"></i>
        </div>

        <h2 className="eth-confirm-title">Paiement confirmé</h2>
        <p className="eth-confirm-sub">
          Merci pour votre commande. Vous recevrez un email de confirmation avec le suivi de votre colis.
        </p>

        {/* Spinner pendant vérification */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div className="spinner-border eth-spinner spinner-border-sm"></div>
          </div>
        )}

        {/* Erreur de vérification (non bloquante — le paiement est quand même passé) */}
        {!loading && verifyErr && (
          <div className="eth-inline-error mb-3" style={{ fontSize: 13 }}>
            <i className="fa-solid fa-circle-info me-2"></i>
            {verifyErr}
          </div>
        )}

        {/* Référence commande */}
        {!loading && oid && (
          <div className="eth-confirm-ref">
            <i className="fa-solid fa-receipt" style={{ color: 'var(--tc-classic)' }}></i>
            <span>Référence :</span>
            <strong>{order?.oid || oid}</strong>
            {order?.total && (
              <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--tc-dark)' }}>
                {formatPrice(order.total)}
              </span>
            )}
          </div>
        )}

        {/* Détail articles */}
        {!loading && order?.items?.length > 0 && (
          <div style={{ borderTop: '1px solid var(--sand)', paddingTop: 14, marginBottom: 8 }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--text-mid)',
                  padding: '4px 0',
                }}
              >
                <span>
                  {item.product_name}
                  <span style={{ color: 'var(--text-light)', marginLeft: 6 }}>×{item.quantity}</span>
                </span>
                <span style={{ fontWeight: 600 }}>{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Infos livraison */}
        <div style={{
          background: 'var(--cream)',
          borderRadius: 'var(--r-md)',
          padding: '14px 18px',
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13 }}>
            <i className="fa-solid fa-truck-fast" style={{ color: 'var(--tc-classic)', width: 16 }}></i>
            <span style={{ color: 'var(--text-mid)' }}>
              Livraison estimée en <strong style={{ color: 'var(--text-dark)' }}>5 à 8 jours ouvrés</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <i className="fa-solid fa-envelope" style={{ color: 'var(--tc-classic)', width: 16 }}></i>
            <span style={{ color: 'var(--text-mid)' }}>Un email de confirmation vous a été envoyé</span>
          </div>
        </div>

        {/* Actions */}
        <div className="eth-confirm-actions">
          <Link to="/compte" className="btn-eth-outline" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-bag-shopping me-2"></i>Mes commandes
          </Link>
          <Link to="/" className="btn-eth-primary" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-house me-2"></i>Retour à l'accueil
          </Link>
        </div>

      </div>
    </div>
  );
}
