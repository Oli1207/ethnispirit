import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import { adminAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import MobileBackButton from '../../components/MobileBackButton';

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

const STATUS_OPTIONS = Object.entries(STATUS_LABELS);

// ── Modal détail commande ─────────────────────────────────────────────────────
function OrderDetailModal({ oid, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`/api/admin/orders/${oid}/`)
      .then(({ data }) => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [oid]);

  const sc = STATUS_COLORS[order?.status] || STATUS_COLORS.pending;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        zIndex: 1100, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: '32px 16px', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620,
        boxShadow: '0 24px 64px rgba(0,0,0,.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--sand)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-light)' }}>Détail commande</p>
            <h5 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 18 }}>{oid}</h5>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1 }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : !order ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>Commande introuvable.</div>
        ) : (
          <div style={{ padding: '24px' }}>

            {/* Statut + date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: sc.bg, color: sc.color,
              }}>
                {STATUS_LABELS[order.status]}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* 2 colonnes : client + livraison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Client */}
              <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
                  <i className="fa-solid fa-user me-2"></i>Client
                </p>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'var(--text-dark)' }}>{order.full_name}</p>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-mid)' }}>{order.email}</p>
                {order.phone && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-mid)' }}>
                    <i className="fa-solid fa-phone me-1" style={{ color: 'var(--tc-light)' }}></i>{order.phone}
                  </p>
                )}
              </div>

              {/* Livraison */}
              <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
                  <i className="fa-solid fa-location-dot me-2"></i>Adresse
                </p>
                <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13, color: 'var(--text-dark)', lineHeight: 1.5 }}>{order.address}</p>
                <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--text-mid)' }}>{order.postal_code} {order.city}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-mid)' }}>{order.country}</p>
              </div>
            </div>

            {/* Articles */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
                <i className="fa-solid fa-bag-shopping me-2"></i>Articles ({order.items?.length})
              </p>
              <div style={{ border: '1px solid var(--sand)', borderRadius: 10, overflow: 'hidden' }}>
                {order.items?.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 16px', borderBottom: i < order.items.length - 1 ? '1px solid var(--sand)' : 'none',
                    fontSize: 13,
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.product_name}</span>
                      <span style={{ color: 'var(--text-light)', marginLeft: 8 }}>× {item.quantity}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--tc-classic)' }}>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Récap financier */}
            <div style={{ border: '1px solid var(--sand)', borderRadius: 10, overflow: 'hidden' }}>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--sand)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-mid)' }}>
                    Réduction{order.promo_code_used ? ` (${order.promo_code_used})` : ''}
                  </span>
                  <span style={{ color: 'var(--bio-main)', fontWeight: 700 }}>− {formatPrice(order.discount)}</span>
                </div>
              )}
              {order.shipping_cost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--sand)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-mid)' }}>Livraison</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(order.shipping_cost)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', fontSize: 15 }}>
                <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Total</span>
                <span style={{ fontWeight: 800, color: 'var(--tc-classic)', fontSize: 17 }}>{formatPrice(order.total)}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('');
  const [detailOid, setDetailOid]   = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get('/api/admin/orders/')
      .then(({ data }) => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleExportCSV() {
    setCsvLoading(true);
    try {
      const response = await adminAPI.exportOrders();
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore — browser will show nothing
    } finally {
      setCsvLoading(false);
    }
  }

  function handleStatusChange(oid, newStatus) {
    axiosInstance.patch(`/api/orders/${oid}/status/`, { status: newStatus })
      .then(({ data }) => {
        setOrders((prev) => prev.map((o) => o.oid === oid ? { ...o, status: data.status } : o));
      })
      .catch(() => {});
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.oid.includes(search) || o.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filter || o.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/admin-dashboard" label="Dashboard" />
      {/* Header */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Administration</p>
            <h1 className="eth-section-title">Gestion des <em>commandes</em></h1>
          </div>
        </div>
      </div>

      <div className="eth-page-body">
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-light)', fontSize: 13, pointerEvents: 'none',
            }}></i>
            <input
              type="search"
              className="form-control eth-input"
              style={{ paddingLeft: 38, width: 280 }}
              placeholder="Référence, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select eth-input"
            style={{ width: 200 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={handleExportCSV}
            disabled={csvLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 'var(--r-sm)',
              border: '1px solid var(--sand)', background: '#fff',
              color: 'var(--text-dark)', fontSize: 13, fontWeight: 600,
              cursor: csvLoading ? 'not-allowed' : 'pointer',
              opacity: csvLoading ? .6 : 1,
              marginLeft: 'auto',
            }}
          >
            {csvLoading
              ? <><span className="spinner-border spinner-border-sm"></span> Export…</>
              : <><i className="fa-solid fa-file-csv"></i> Exporter CSV</>
            }
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--sand)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                {filtered.length} commande{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="table-responsive">
              <table className="table eth-admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Statut</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                    return (
                      <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setDetailOid(order.oid)}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-dark)', fontWeight: 700 }}>
                            {order.oid}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-dark)' }}>{order.full_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{order.email}</div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                          {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--tc-classic)' }}>
                            {formatPrice(order.total)}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            className="form-select form-select-sm eth-input"
                            style={{
                              minWidth: 150, fontSize: 12, padding: '5px 10px',
                              color: sc.color, fontWeight: 600,
                            }}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.oid, e.target.value)}
                          >
                            {STATUS_OPTIONS.map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setDetailOid(order.oid)}
                            style={{
                              background: 'var(--cream)', border: '1px solid var(--sand)',
                              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                              color: 'var(--text-mid)', fontSize: 13,
                            }}
                            title="Voir les détails"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px', fontSize: 14 }}>
                  Aucune commande trouvée.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal détail */}
      {detailOid && (
        <OrderDetailModal oid={detailOid} onClose={() => setDetailOid(null)} />
      )}
    </div>
  );
}
