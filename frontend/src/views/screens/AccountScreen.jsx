import { useEffect, useState } from 'react';
import { authAPI, ordersAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import useAuthStore from '../../store/auth';

// ── Modal détail commande (client) ────────────────────────────────────────────
const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const STATUS_STEP_LABELS = {
  pending:    'En attente',
  paid:       'Payée',
  processing: 'En préparation',
  shipped:    'Expédiée',
  delivered:  'Livrée',
};

function ClientOrderModal({ oid, onClose }) {
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.detail(oid)
      .then(({ data }) => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [oid]);

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

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
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580,
        boxShadow: '0 24px 64px rgba(0,0,0,.18)', marginBottom: 32,
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--sand)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-light)' }}>
              Détail de la commande
            </p>
            <h5 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 18 }}>{oid}</h5>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1 }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : !order ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>Commande introuvable.</div>
        ) : (
          <div style={{ padding: '24px' }}>

            {/* Tracker de statut */}
            {order.status !== 'cancelled' && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {/* Barre de progression */}
                  <div style={{
                    position: 'absolute', top: 14, left: '10%', right: '10%',
                    height: 2, background: 'var(--sand)',
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'var(--tc-classic)',
                      width: currentStep >= 0
                        ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`
                        : '0%',
                      transition: 'width .4s ease',
                    }}></div>
                  </div>
                  {STATUS_STEPS.map((s, i) => (
                    <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: i <= currentStep ? 'var(--tc-classic)' : '#fff',
                        border: `2px solid ${i <= currentStep ? 'var(--tc-classic)' : 'var(--sand)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .3s',
                      }}>
                        {i < currentStep ? (
                          <i className="fa-solid fa-check" style={{ fontSize: 11, color: '#fff' }}></i>
                        ) : i === currentStep ? (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }}></div>
                        ) : null}
                      </div>
                      <span style={{
                        fontSize: 10, marginTop: 6, textAlign: 'center',
                        color: i <= currentStep ? 'var(--tc-classic)' : 'var(--text-light)',
                        fontWeight: i === currentStep ? 700 : 400,
                        lineHeight: 1.2,
                      }}>
                        {STATUS_STEP_LABELS[s]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.status === 'cancelled' && (
              <div style={{
                background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                display: 'flex', gap: 10, alignItems: 'center',
                color: '#C0392B', fontSize: 13, fontWeight: 600,
              }}>
                <i className="fa-solid fa-circle-xmark"></i>
                Commande annulée
              </div>
            )}

            {/* Date */}
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 20, textAlign: 'right' }}>
              Passée le {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {/* Adresse */}
            <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
                <i className="fa-solid fa-location-dot me-2"></i>Adresse de livraison
              </p>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13, color: 'var(--text-dark)' }}>{order.full_name}</p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--text-mid)' }}>{order.address}</p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--text-mid)' }}>{order.postal_code} {order.city}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-mid)' }}>{order.country}</p>
            </div>

            {/* Articles */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
                <i className="fa-solid fa-bag-shopping me-2"></i>Articles ({order.items?.length})
              </p>
              <div style={{ border: '1px solid var(--sand)', borderRadius: 10, overflow: 'hidden' }}>
                {order.items?.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 16px',
                    borderBottom: i < order.items.length - 1 ? '1px solid var(--sand)' : 'none',
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

const STATUS_LABELS = {
  pending:    'En attente',
  paid:       'Payée',
  processing: 'En traitement',
  shipped:    'Expédiée',
  delivered:  'Livrée',
  cancelled:  'Annulée',
};

const STATUS_COLORS = {
  pending:    'var(--text-light)',
  paid:       'var(--tc-classic)',
  processing: '#E8A020',
  shipped:    '#2680C2',
  delivered:  'var(--bio-main)',
  cancelled:  '#C0392B',
};

export default function AccountScreen() {
  const fetchMe      = useAuthStore((s) => s.fetchMe);
  const user         = useAuthStore((s) => s.user);
  const [tab, setTab]       = useState('profile');
  const [orders, setOrders] = useState([]);
  const [detailOid, setDetailOid] = useState(null);
  const [profile, setProfile]   = useState({ full_name: '', phone: '', city: '', country: '', address: '' });
  const [pwForm, setPwForm]     = useState({ old_password: '', new_password: '', new_password2: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg]           = useState('');
  const [pwError, setPwError]       = useState('');

  useEffect(() => {
    fetchMe();
    ordersAPI.list()
      .then(({ data }) => setOrders(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        phone:     user.profile?.phone || '',
        city:      user.profile?.city || '',
        country:   user.profile?.country || '',
        address:   user.profile?.address || '',
      });
    }
  }, [user]);

  function handleProfileSave(e) {
    e.preventDefault();
    authAPI.updateProfile(profile)
      .then(() => { setProfileMsg('Profil mis à jour avec succès.'); fetchMe(); })
      .catch(() => setProfileMsg('Erreur lors de la mise à jour.'));
  }

  function handlePwSave(e) {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    authAPI.changePassword(pwForm)
      .then(() => {
        setPwMsg('Mot de passe modifié avec succès.');
        setPwForm({ old_password: '', new_password: '', new_password2: '' });
      })
      .catch((err) => setPwError(err.response?.data?.old_password || 'Erreur lors de la modification.'));
  }

  const TABS = [
    { key: 'profile',  icon: 'fa-user-pen',    label: 'Mon profil' },
    { key: 'orders',   icon: 'fa-bag-shopping', label: 'Mes commandes' },
    { key: 'password', icon: 'fa-key',          label: 'Sécurité' },
  ];

  return (
    <div style={{ background: 'var(--cream)' }}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Espace personnel</p>
            <h1 className="eth-section-title">Mon <em>compte</em></h1>
            {user && (
              <p className="eth-section-sub mt-1">
                <i className="fa-solid fa-circle-user me-2" style={{ color: 'var(--tc-classic)' }}></i>
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="eth-page-body">
        <div className="eth-account-layout">

          {/* Sidebar */}
          <aside className="eth-account-sidebar">
            <div className="eth-account-user-card">
              <div className="eth-account-avatar">
                <i className="fa-solid fa-user"></i>
              </div>
              <div>
                <p className="eth-account-name">{user?.full_name || 'Mon compte'}</p>
                <p className="eth-account-email">{user?.email}</p>
              </div>
            </div>

            <nav className="eth-account-nav">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  className={`eth-account-tab ${tab === item.key ? 'active' : ''}`}
                  onClick={() => setTab(item.key)}
                >
                  <span className="eth-account-tab-icon">
                    <i className={`fa-solid ${item.icon}`}></i>
                  </span>
                  <span>{item.label}</span>
                  {tab === item.key && (
                    <i className="fa-solid fa-chevron-right ms-auto" style={{ fontSize: 11, opacity: 0.5 }}></i>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main panel */}
          <div className="eth-account-main">

            {/* ── Profil ─────────────────────────────────────────────── */}
            {tab === 'profile' && (
              <div className="eth-account-panel">
                <div className="eth-panel-header">
                  <i className="fa-solid fa-user-pen eth-panel-header-icon"></i>
                  <div>
                    <h5 className="eth-panel-title">Informations personnelles</h5>
                    <p className="eth-panel-sub">Modifiez vos coordonnées et adresse de livraison.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="eth-label">Nom complet</label>
                      <input
                        className="form-control eth-input"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Marie Dupont"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="eth-label">Téléphone</label>
                      <input
                        className="form-control eth-input"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+596 696 00 00 00"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="eth-label">Ville</label>
                      <input
                        className="form-control eth-input"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        placeholder="Fort-de-France"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="eth-label">Île / Pays</label>
                      <input
                        className="form-control eth-input"
                        value={profile.country}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        placeholder="Martinique"
                      />
                    </div>
                    <div className="col-12">
                      <label className="eth-label">Adresse complète</label>
                      <textarea
                        className="form-control eth-input"
                        rows={2}
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="12 rue des Flamboyants, 97200..."
                      />
                    </div>
                  </div>

                  {profileMsg && (
                    <div className="eth-inline-success mt-3">
                      <i className="fa-solid fa-circle-check me-2"></i>{profileMsg}
                    </div>
                  )}

                  <div className="mt-4">
                    <button type="submit" className="btn-eth-primary" style={{ padding: '11px 28px' }}>
                      <i className="fa-solid fa-floppy-disk me-2"></i>Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Commandes ──────────────────────────────────────────── */}
            {tab === 'orders' && (
              <div className="eth-account-panel">
                <div className="eth-panel-header">
                  <i className="fa-solid fa-bag-shopping eth-panel-header-icon"></i>
                  <div>
                    <h5 className="eth-panel-title">Mes commandes</h5>
                    <p className="eth-panel-sub">{orders.length} commande{orders.length !== 1 ? 's' : ''} au total.</p>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="eth-empty-state">
                    <div className="eth-empty-icon">
                      <i className="fa-solid fa-bag-shopping"></i>
                    </div>
                    <h6>Aucune commande pour l'instant</h6>
                    <p>Vos commandes apparaîtront ici dès votre premier achat.</p>
                  </div>
                ) : (
                  <div className="eth-orders-list">
                    {orders.map((order) => (
                      <div
                        className="eth-order-row"
                        key={order.id}
                        onClick={() => setDetailOid(order.oid)}
                        style={{ cursor: 'pointer' }}
                        title="Voir le détail"
                      >
                        <div className="eth-order-ref">
                          <span className="eth-order-id">
                            <i className="fa-solid fa-receipt me-2" style={{ color: 'var(--tc-classic)', fontSize: 13 }}></i>
                            {order.oid}
                          </span>
                          <span className="eth-order-date">
                            {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="eth-order-status-wrap">
                          <span
                            className="eth-order-status-badge"
                            style={{ color: STATUS_COLORS[order.status] || 'var(--text-mid)' }}
                          >
                            <i className="fa-solid fa-circle me-1" style={{ fontSize: 7 }}></i>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <span className="eth-order-total">{formatPrice(order.total)}</span>
                        <i
                          className="fa-solid fa-chevron-right"
                          style={{ fontSize: 11, color: 'var(--text-light)', marginLeft: 8 }}
                        ></i>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Mot de passe ───────────────────────────────────────── */}
            {tab === 'password' && (
              <div className="eth-account-panel">
                <div className="eth-panel-header">
                  <i className="fa-solid fa-shield-halved eth-panel-header-icon"></i>
                  <div>
                    <h5 className="eth-panel-title">Sécurité du compte</h5>
                    <p className="eth-panel-sub">Changez votre mot de passe régulièrement.</p>
                  </div>
                </div>

                <form onSubmit={handlePwSave} style={{ maxWidth: 440 }}>
                  <div className="mb-3">
                    <label className="eth-label">Mot de passe actuel</label>
                    <input
                      type="password"
                      className="form-control eth-input"
                      value={pwForm.old_password}
                      onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="eth-label">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="form-control eth-input"
                      value={pwForm.new_password}
                      onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="eth-label">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      className="form-control eth-input"
                      value={pwForm.new_password2}
                      onChange={(e) => setPwForm({ ...pwForm, new_password2: e.target.value })}
                      required
                    />
                  </div>

                  {pwError && (
                    <div className="eth-inline-error mb-3">
                      <i className="fa-solid fa-circle-exclamation me-2"></i>{pwError}
                    </div>
                  )}
                  {pwMsg && (
                    <div className="eth-inline-success mb-3">
                      <i className="fa-solid fa-circle-check me-2"></i>{pwMsg}
                    </div>
                  )}

                  <button type="submit" className="btn-eth-primary" style={{ padding: '11px 28px' }}>
                    <i className="fa-solid fa-lock me-2"></i>Modifier le mot de passe
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Modal détail commande ─────────────────────────────────────── */}
      {detailOid && (
        <ClientOrderModal oid={detailOid} onClose={() => setDetailOid(null)} />
      )}
    </div>
  );
}
