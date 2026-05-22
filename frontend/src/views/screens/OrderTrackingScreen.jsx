import { useState } from 'react';
import axiosInstance from '../../utils/axios';
import { formatPrice } from '../../utils/currency';
import SEO from '../../components/SEO';

const STATUS_LABELS = {
  pending:    'En attente',
  paid:       'Payée',
  processing: 'En traitement',
  shipped:    'Expédiée',
  delivered:  'Livrée',
  cancelled:  'Annulée',
};

const STATUS_COLORS = {
  pending:    { bg: 'rgba(200,200,200,.2)',    color: 'var(--text-mid)' },
  paid:       { bg: 'rgba(198,93,59,.12)',     color: 'var(--tc-classic)' },
  processing: { bg: 'rgba(230,160,32,.15)',    color: '#C07800' },
  shipped:    { bg: 'rgba(38,128,194,.12)',    color: '#2680C2' },
  delivered:  { bg: 'rgba(45,90,46,.12)',      color: 'var(--bio-main)' },
  cancelled:  { bg: 'rgba(192,57,43,.1)',      color: '#C0392B' },
};

export default function OrderTrackingScreen() {
  const [oid, setOid]       = useState('');
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder]   = useState(null);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!oid.trim() || !email.trim()) {
      setError('Veuillez renseigner votre référence de commande et votre e-mail.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const { data } = await axiosInstance.get('/api/orders/track/', {
        params: { oid: oid.trim(), email: email.trim() },
      });
      setOrder(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Aucune commande trouvée avec ces informations. Vérifiez la référence et l\'adresse e-mail.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }

  const sc = order ? (STATUS_COLORS[order.status] || STATUS_COLORS.pending) : null;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <SEO
        title="Suivi de commande"
        description="Suivez l'état de votre commande EthniSpirit en saisissant votre référence et votre adresse e-mail."
      />

      {/* Header */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">EthniSpirit</p>
            <h1 className="eth-section-title">Suivi de <em>commande</em></h1>
          </div>
        </div>
      </div>

      <div className="eth-page-body">
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Formulaire */}
          <div style={{
            background: '#fff', borderRadius: 'var(--r-lg)',
            border: '1px solid var(--sand)', padding: '32px 28px',
            boxShadow: 'var(--sh-sm)', marginBottom: 28,
          }}>
            <h5 style={{
              fontFamily: 'Playfair Display, serif', color: 'var(--text-dark)',
              marginBottom: 8, fontSize: 18,
            }}>
              <i className="fa-solid fa-magnifying-glass me-2" style={{ color: 'var(--tc-classic)' }}></i>
              Retrouver ma commande
            </h5>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 24 }}>
              Saisissez la référence de commande reçue par e-mail et votre adresse e-mail.
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-mid)', marginBottom: 6 }}>
                  Référence commande
                </label>
                <input
                  type="text"
                  className="form-control eth-input"
                  placeholder="ex. ES-20240115-ABCD"
                  value={oid}
                  onChange={(e) => setOid(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-mid)', marginBottom: 6 }}>
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  className="form-control eth-input"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && (
                <div className="eth-inline-error mb-3">
                  <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
                </div>
              )}
              <button
                type="submit"
                className="btn-eth-primary"
                style={{ width: '100%', padding: '12px 0' }}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Recherche…</>
                  : <><i className="fa-solid fa-magnifying-glass me-2"></i>Suivre ma commande</>
                }
              </button>
            </form>
          </div>

          {/* Résultat */}
          {order && (
            <div style={{
              background: '#fff', borderRadius: 'var(--r-lg)',
              border: '1px solid var(--sand)', overflow: 'hidden',
              boxShadow: 'var(--sh-sm)',
            }}>
              {/* Statut */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid var(--sand)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-light)' }}>
                    Commande
                  </p>
                  <h6 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 16, color: 'var(--text-dark)' }}>
                    {order.oid}
                  </h6>
                </div>
                <span style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                  background: sc.bg, color: sc.color,
                }}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {/* Date */}
                <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
                  <i className="fa-solid fa-calendar me-2" style={{ color: 'var(--tc-light)' }}></i>
                  Passée le {new Date(order.date).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>

                {/* Articles */}
                {order.items?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
                      <i className="fa-solid fa-bag-shopping me-2"></i>Articles ({order.items.length})
                    </p>
                    <div style={{ border: '1px solid var(--sand)', borderRadius: 10, overflow: 'hidden' }}>
                      {order.items.map((item, i) => (
                        <div key={item.id || i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '11px 16px',
                          borderBottom: i < order.items.length - 1 ? '1px solid var(--sand)' : 'none',
                          fontSize: 13,
                        }}>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.product_name}</span>
                            <span style={{ color: 'var(--text-light)', marginLeft: 8 }}>× {item.quantity}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--tc-classic)' }}>
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0', borderTop: '1px solid var(--sand)',
                }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-dark)' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--tc-classic)' }}>
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
