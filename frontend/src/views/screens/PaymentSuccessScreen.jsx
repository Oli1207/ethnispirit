import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ordersAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import { trackEventStandalone } from '../../hooks/useTracking';

export default function PaymentSuccessScreen() {
  const [searchParams]        = useSearchParams();
  const oid                   = searchParams.get('oid');
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyErr, setVerifyErr] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!oid) { setLoading(false); return; }
    // Léger délai pour laisser SumUp finaliser côté serveur
    const timer = setTimeout(() => {
      ordersAPI.verify(oid)
        .then(({ data }) => {
          setOrder(data);
          if (data._sumup_pending) {
            setPending(true);
          } else {
            trackEventStandalone('purchase', {
              order_oid: data.oid,
              value:     parseFloat(data.total),
            });
          }
        })
        .catch((err) => {
          const serverMsg = err.response?.data?.error;
          setVerifyErr(serverMsg || 'Le paiement n\'a pas pu être confirmé.');
        })
        .finally(() => setLoading(false));
    }, 1200);
    return () => clearTimeout(timer);
  }, [oid]);

  const failed = !loading && !!verifyErr;

  return (
    <div className="eth-confirm-page">
      <div className="eth-confirm-card">

        {/* Icône — reflète le vrai statut du paiement */}
        <div className={`eth-confirm-icon-wrap ${failed ? 'eth-confirm-icon-fail' : 'eth-confirm-icon-success'}`}>
          <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : failed ? 'fa-circle-xmark' : 'fa-circle-check'}`}></i>
        </div>

        {loading ? (
          <>
            <h2 className="eth-confirm-title">Vérification du paiement…</h2>
            <p className="eth-confirm-sub">Merci de patienter un instant.</p>
          </>
        ) : failed ? (
          <>
            <h2 className="eth-confirm-title">Paiement non abouti</h2>
            <p className="eth-confirm-sub">{verifyErr}</p>
          </>
        ) : pending ? (
          <>
            <h2 className="eth-confirm-title">Paiement en cours de traitement</h2>
            <p className="eth-confirm-sub">
              Nous confirmons votre paiement avec notre prestataire. Vous recevrez un email dès que c'est validé.
            </p>
          </>
        ) : (
          <>
            <h2 className="eth-confirm-title">Paiement confirmé</h2>
            <p className="eth-confirm-sub">
              Merci pour votre commande. Vous recevrez un email de confirmation avec le suivi de votre colis.
            </p>
          </>
        )}

        {/* Spinner pendant vérification */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div className="spinner-border eth-spinner spinner-border-sm"></div>
          </div>
        )}

        {/* Référence commande */}
        {!loading && !failed && oid && (
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
        {!loading && !failed && (
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
        )}

        {/* Actions */}
        {!loading && (
          <div className="eth-confirm-actions">
            {failed ? (
              <>
                <Link to="/panier" className="btn-eth-outline" style={{ padding: '11px 24px' }}>
                  <i className="fa-solid fa-cart-shopping me-2"></i>Retour au panier
                </Link>
                <Link to="/" className="btn-eth-primary" style={{ padding: '11px 24px' }}>
                  <i className="fa-solid fa-house me-2"></i>Retour à l'accueil
                </Link>
              </>
            ) : (
              <>
                <Link to="/compte" className="btn-eth-outline" style={{ padding: '11px 24px' }}>
                  <i className="fa-solid fa-bag-shopping me-2"></i>Mes commandes
                </Link>
                <Link to="/" className="btn-eth-primary" style={{ padding: '11px 24px' }}>
                  <i className="fa-solid fa-house me-2"></i>Retour à l'accueil
                </Link>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
