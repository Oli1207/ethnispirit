import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import MobileBackButton from '../../components/MobileBackButton';
import { subscribeToPush, unsubscribeFromPush, isSubscribed, isPushSupported } from '../../services/pushService';
import useAuthStore from '../../store/auth';

const SHORTCUTS = [
  { to: '/admin-dashboard/produits',          icon: 'fa-box',                    label: 'Produits',          desc: 'Ajouter, modifier, archiver' },
  { to: '/admin-dashboard/commandes',         icon: 'fa-bag-shopping',           label: 'Commandes',         desc: 'Suivi et statuts' },
  { to: '/admin-dashboard/categories',        icon: 'fa-tags',                   label: 'Catégories',        desc: 'Mode et Bio' },
  { to: '/admin-dashboard/promo',             icon: 'fa-tag',                    label: 'Codes promo',       desc: 'Créer et gérer les réductions' },
  { to: '/admin-dashboard/newsletter',        icon: 'fa-envelope',               label: 'Newsletter',        desc: 'Liste des abonnés' },
  { to: '/admin-dashboard/livraison',         icon: 'fa-truck-fast',             label: 'Livraison',         desc: 'Zones et tarifs' },
  { to: '/admin-dashboard/contacts',          icon: 'fa-comments',               label: 'Messages',          desc: 'Formulaire de contact' },
  { to: '/admin-dashboard/demandes-produits', icon: 'fa-magnifying-glass-plus',  label: 'Demandes produits', desc: 'Produits recherchés par les visiteurs' },
  { to: '/admin-dashboard/analytics',         icon: 'fa-chart-line',             label: 'Analytics',         desc: 'Trafic, ventes, géoloc' },
  { to: '/admin-dashboard/equipe',            icon: 'fa-users',                  label: 'Équipe',            desc: 'Comptes staff & permissions', superadminOnly: true },
];

export default function AdminDashboard() {
  const [stats,         setStats]         = useState(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading,   setPushLoading]   = useState(false);
  const [pushMsg,       setPushMsg]       = useState('');
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    adminAPI.stats()
      .then(({ data }) => setStats(data))
      .catch(() => {});
    // Vérifier l'état d'abonnement push
    isSubscribed().then(setPushSubscribed);
  }, []);

  async function handlePushToggle() {
    setPushLoading(true);
    setPushMsg('');
    if (pushSubscribed) {
      const res = await unsubscribeFromPush();
      if (res.success) { setPushSubscribed(false); setPushMsg('Notifications désactivées.'); }
      else setPushMsg('Erreur lors de la désinscription.');
    } else {
      const res = await subscribeToPush([]);
      if (res.success) { setPushSubscribed(true); setPushMsg(res.message); }
      else setPushMsg(res.message);
    }
    setPushLoading(false);
    setTimeout(() => setPushMsg(''), 4000);
  }

  const STAT_CARDS = stats ? [
    {
      icon: 'fa-bag-shopping',
      label: 'Commandes',
      value: stats.total_orders,
      bg: 'rgba(198,93,59,.1)',
      color: 'var(--tc-classic)',
    },
    {
      icon: 'fa-euro-sign',
      label: "Chiffre d'affaires",
      value: formatPrice(stats.revenue),
      bg: 'rgba(45,90,46,.1)',
      color: 'var(--bio-main)',
    },
    {
      icon: 'fa-box',
      label: 'Produits actifs',
      value: stats.total_products,
      bg: 'rgba(230,160,32,.12)',
      color: '#C07800',
    },
    {
      icon: 'fa-users',
      label: 'Clients',
      value: stats.total_clients,
      bg: 'rgba(38,128,194,.1)',
      color: '#2680C2',
    },
  ] : [];

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/" label="Accueil" />
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Administration</p>
            <h1 className="eth-section-title">Tableau de <em>bord</em></h1>
          </div>
        </div>
      </div>

      <div className="eth-page-body">

        {/* ── Stats ────────────────────────────────────────────────────── */}
        {stats ? (
          <div className="eth-admin-stats-grid">
            {STAT_CARDS.map((card) => (
              <div
                key={card.label}
                style={{
                  background: '#fff', borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--sand)', padding: '24px 20px',
                  display: 'flex', gap: 16, alignItems: 'center',
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--r-md)',
                  background: card.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className={`fa-solid ${card.icon}`} style={{ color: card.color, fontSize: 20 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-dark)', fontFamily: 'Playfair Display, serif' }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>{card.label}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            {[1,2,3,4].map((i) => (
              <div key={i} style={{
                flex: 1, height: 100, borderRadius: 'var(--r-lg)',
                background: 'var(--sand)', opacity: 0.5, animation: 'pulse 1.5s infinite',
              }}></div>
            ))}
          </div>
        )}

        {/* ── Accès rapides ────────────────────────────────────────────── */}
        <h4 style={{
          fontFamily: 'Playfair Display, serif', fontSize: 18,
          color: 'var(--text-dark)', marginBottom: 16, marginTop: 36,
        }}>
          Accès rapides
        </h4>
        <div className="eth-admin-shortcuts-grid">
          {SHORTCUTS.filter((link) => !link.superadminOnly || (user && user.is_superuser)).map((link) => (
            <Link key={link.label} to={link.to} className="eth-admin-shortcut-card">
              <div className="eth-admin-shortcut-icon">
                <i className={`fa-solid ${link.icon}`}></i>
              </div>
              <div>
                <p className="eth-admin-shortcut-label">{link.label}</p>
                <p className="eth-admin-shortcut-desc">{link.desc}</p>
              </div>
              <i className="fa-solid fa-chevron-right ms-auto" style={{ fontSize: 11, color: 'var(--text-light)' }}></i>
            </Link>
          ))}
        </div>

        {/* ── Notifications push ───────────────────────────────────────── */}
        {isPushSupported() && (
          <div style={{
            marginTop: 40, padding: '20px 24px',
            background: '#fff', borderRadius: 'var(--r-lg)',
            border: '1px solid var(--sand)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-dark)' }}>
                <i className={`fa-solid fa-${pushSubscribed ? 'bell' : 'bell-slash'} me-2`}
                   style={{ color: pushSubscribed ? 'var(--tc-classic)' : 'var(--text-light)' }}></i>
                Notifications push
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                {pushSubscribed
                  ? 'Vous recevrez des notifications pour les nouvelles commandes, messages et alertes stock.'
                  : 'Activez les notifications pour être alerté en temps réel.'}
              </div>
              {pushMsg && (
                <div style={{ fontSize: 13, marginTop: 6, color: pushSubscribed ? 'var(--bio-main)' : 'var(--tc-classic)' }}>
                  {pushMsg}
                </div>
              )}
            </div>
            <button
              className={`eth-btn-sm ${pushSubscribed ? 'eth-btn-outline' : 'eth-btn-primary'}`}
              onClick={handlePushToggle}
              disabled={pushLoading}
              style={{ whiteSpace: 'nowrap', minWidth: 160 }}
            >
              {pushLoading
                ? <span className="spinner-border spinner-border-sm" />
                : pushSubscribed
                  ? <><i className="fa-solid fa-bell-slash me-2"></i>Désactiver</>
                  : <><i className="fa-solid fa-bell me-2"></i>Activer les notifs</>
              }
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
