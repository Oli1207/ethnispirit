import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../utils/axios';
import { formatPrice } from '../../utils/currency';
import MobileBackButton from '../../components/MobileBackButton';

// ── Couleurs par source ──────────────────────────────────────────────────────
const SOURCE_STYLES = {
  instagram:  { bg: 'rgba(131,58,180,.1)',  color: '#833AB4' },
  facebook:   { bg: 'rgba(24,119,242,.1)',  color: '#1877F2' },
  tiktok:     { bg: 'rgba(0,0,0,.06)',      color: '#000' },
  google:     { bg: 'rgba(66,133,244,.1)',  color: '#4285F4' },
  whatsapp:   { bg: 'rgba(37,211,102,.1)',  color: '#25D366' },
  newsletter: { bg: 'rgba(230,160,32,.12)', color: '#C07800' },
  email:      { bg: 'rgba(230,160,32,.12)', color: '#C07800' },
  direct:     { bg: 'var(--sand)',          color: 'var(--text-mid)' },
};
function sourceStyle(src) {
  return SOURCE_STYLES[src?.toLowerCase()] || { bg: 'rgba(38,128,194,.1)', color: '#2680C2' };
}

// ── Table UTM avec onglets source / campagne ─────────────────────────────────
function UtmTable({ sources = [], campaigns = [] }) {
  const [tab, setTab] = useState('source');
  const noData = tab === 'source' ? sources.length === 0 : campaigns.length === 0;

  return (
    <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)', overflow: 'hidden' }}>
      {/* Header + onglets */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-chart-pie" style={{ color: '#2680C2', fontSize: 13 }}></i>
          <h6 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, margin: 0, color: 'var(--text-dark)' }}>
            Sources de trafic
          </h6>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'source',   label: 'Par source' },
            { key: 'campaign', label: 'Par campagne' },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${tab === t.key ? 'var(--tc-classic)' : 'var(--sand)'}`,
              background: tab === t.key ? 'var(--tc-classic)' : '#fff',
              color: tab === t.key ? '#fff' : 'var(--text-mid)', transition: 'all .2s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {noData ? (
        <p style={{ padding: '30px 20px', color: 'var(--text-light)', fontSize: 13, textAlign: 'center' }}>Pas encore de données</p>
      ) : tab === 'source' ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--cream)' }}>
              {['Source', 'Sessions', 'Commandes', 'CA'].map((h) => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((s, i) => {
              const st = sourceStyle(s.source);
              return (
                <tr key={i} style={{ borderTop: '1px solid var(--sand)' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>
                      {s.source || 'direct'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-dark)', fontWeight: 600 }}>{s.sessions}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-mid)' }}>{s.orders || 0}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--bio-main)', fontWeight: 700 }}>{s.revenue ? formatPrice(s.revenue) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--cream)' }}>
              {['Source', 'Medium', 'Campagne', 'Contenu', 'Sessions', 'Cmdes', 'CA'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const st = sourceStyle(c.source);
              return (
                <tr key={i} style={{ borderTop: '1px solid var(--sand)' }}>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
                      {c.source || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-mid)', fontSize: 12 }}>{c.medium || '—'}</td>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text-dark)', fontSize: 12 }}>{c.campaign || '—'}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-light)', fontSize: 11 }}>{c.content || '—'}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-dark)', fontWeight: 600 }}>{c.sessions}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-mid)' }}>{c.orders || 0}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--bio-main)', fontWeight: 700 }}>{c.revenue ? formatPrice(c.revenue) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const PERIOD_OPTIONS = [
  { val: 7,  label: '7 jours' },
  { val: 30, label: '30 jours' },
  { val: 90, label: '90 jours' },
];

// ── Mini graphique barres SVG ────────────────────────────────────────────────
function BarChart({ data, valueKey = 'revenue', dateKey = 'date', color = 'var(--tc-classic)' }) {
  if (!data?.length) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 13 }}>
      Pas encore de données
    </div>
  );

  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  const W = 600, H = 100, barW = Math.max(4, Math.floor(W / data.length) - 3);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', minWidth: 200 }}>
        {data.map((d, i) => {
          const h  = Math.max(2, ((d[valueKey] || 0) / max) * H);
          const x  = (i / data.length) * W + 2;
          const y  = H - h;
          const label = d[dateKey] ? new Date(d[dateKey]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx={2} fill={color} opacity={0.85}>
                <title>{label} : {typeof d[valueKey] === 'number' ? d[valueKey].toFixed(2) : d[valueKey]}</title>
              </rect>
              {data.length <= 14 && (
                <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize={9} fill="var(--text-light)">
                  {label.split(' ')[0]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Jauge entonnoir ──────────────────────────────────────────────────────────
function FunnelStep({ label, count, pct, color, isLast }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>
          {count.toLocaleString('fr-FR')}
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-light)', marginLeft: 6 }}>{pct}%</span>
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--sand)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: color,
          width: `${Math.max(pct, pct > 0 ? 1 : 0)}%`,
          transition: 'width .6s ease',
        }}></div>
      </div>
    </div>
  );
}

const FUNNEL_COLORS = [
  '#2680C2', 'var(--tc-classic)', '#E8A020', '#8E44AD', 'var(--bio-main)',
];

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, bg }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)',
      padding: '20px 18px', display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 'var(--r-md)',
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`fa-solid ${icon}`} style={{ color, fontSize: 18 }}></i>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dark)', fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]     = useState(30);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(`/api/admin/analytics/?days=${days}`)
      .then(({ data: d }) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  const deviceIcons = { mobile: 'fa-mobile-screen', tablet: 'fa-tablet-screen-button', desktop: 'fa-desktop' };
  const deviceLabels = { mobile: 'Mobile', tablet: 'Tablette', desktop: 'Desktop' };
  const deviceColors = { mobile: 'var(--tc-classic)', tablet: '#E8A020', desktop: '#2680C2' };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/admin-dashboard" label="Dashboard" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div className="eth-an-header-row">
            <div>
              <p className="eth-section-label">Administration</p>
              <h1 className="eth-section-title">Analytics & <em>tracking</em></h1>
            </div>
            <div className="eth-an-period-btns">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setDays(opt.val)}
                  className={`eth-an-period-btn${days === opt.val ? ' active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="eth-page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : !data ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 60 }}>Impossible de charger les données.</p>
        ) : (
          <>
            {/* ── KPIs ─────────────────────────────────────────────────── */}
            <div className="eth-an-kpi-grid">
              <KpiCard icon="fa-users"        label="Sessions"           value={data.kpis.sessions.toLocaleString('fr-FR')}       color="#2680C2"           bg="rgba(38,128,194,.1)" />
              <KpiCard icon="fa-euro-sign"    label="Chiffre d'affaires" value={formatPrice(data.kpis.revenue)}                   color="var(--bio-main)"   bg="rgba(45,90,46,.1)" />
              <KpiCard icon="fa-bag-shopping" label="Achats"             value={data.kpis.purchases.toLocaleString('fr-FR')}      color="var(--tc-classic)" bg="rgba(198,93,59,.1)" />
              <KpiCard icon="fa-percent"      label="Taux conversion"    value={`${data.kpis.conversion_rate}%`}                  color="#8E44AD"           bg="rgba(142,68,173,.1)" />
              <KpiCard icon="fa-receipt"      label="Panier moyen"       value={formatPrice(data.kpis.avg_order)}                 color="#C07800"           bg="rgba(230,160,32,.12)" />
              <KpiCard icon="fa-user-plus"    label="Clients"            value={data.kpis.new_customers.toLocaleString('fr-FR')}  color="#2680C2"           bg="rgba(38,128,194,.1)" />
            </div>

            {/* ── Revenus + Entonnoir ──────────────────────────────────── */}
            <div className="eth-an-chart-row">
              <div className="eth-an-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                  <h6 className="eth-an-card-title">Revenus par jour</h6>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{days} derniers jours</span>
                </div>
                <BarChart data={data.revenue_chart} valueKey="revenue" dateKey="date" color="var(--tc-classic)" />
              </div>

              <div className="eth-an-card">
                <h6 className="eth-an-card-title" style={{ marginBottom: 20 }}>Entonnoir de conversion</h6>
                {data.funnel.map((step, i) => (
                  <FunnelStep
                    key={step.label}
                    label={step.label}
                    count={step.count}
                    pct={step.pct}
                    color={FUNNEL_COLORS[i] || 'var(--text-mid)'}
                    isLast={i === data.funnel.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* ── Géographie + Sources ─────────────────────────────────── */}
            <div className="eth-an-two-col">
              {/* Top communes */}
              <div className="eth-an-card eth-an-card--flush">
                <div className="eth-an-card-header">
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--tc-classic)', fontSize: 13 }}></i>
                  <h6 className="eth-an-card-title">Top localisations</h6>
                </div>
                {data.top_cities.length === 0 ? (
                  <p className="eth-an-empty">Pas encore de données</p>
                ) : data.top_cities.map((c, i) => {
                  const maxSessions = data.top_cities[0]?.sessions || 1;
                  return (
                    <div key={i} className="eth-an-city-row" style={{ borderBottom: i < data.top_cities.length - 1 ? '1px solid var(--sand)' : 'none' }}>
                      <span className="eth-an-rank">{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.city}
                            {c.region && c.region !== c.city && (
                              <span style={{ fontWeight: 400, color: 'var(--text-light)', marginLeft: 4, fontSize: 11 }}>{c.region}</span>
                            )}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-mid)', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                            {c.sessions}s
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--sand)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 2, background: i === 0 ? 'var(--tc-classic)' : 'rgba(198,93,59,.4)', width: `${(c.sessions / maxSessions) * 100}%` }}></div>
                        </div>
                        {c.revenue > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--bio-main)', fontWeight: 600, marginTop: 2, display: 'block' }}>
                            {formatPrice(c.revenue)} générés
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sources UTM */}
              <UtmTable sources={data.utm_sources ?? []} campaigns={data.utm_campaigns ?? []} />
            </div>

            {/* ── Top produits + Appareils ──────────────────────────────── */}
            <div className="eth-an-products-row">
              {/* Top produits */}
              <div className="eth-an-card eth-an-card--flush">
                <div className="eth-an-card-header">
                  <i className="fa-solid fa-trophy" style={{ color: '#C07800', fontSize: 13 }}></i>
                  <h6 className="eth-an-card-title">Top produits</h6>
                </div>
                {data.top_products.length === 0 ? (
                  <p className="eth-an-empty">Pas encore de ventes</p>
                ) : data.top_products.map((p, i) => (
                  <div key={i} style={{
                    padding: '11px 16px',
                    borderBottom: i < data.top_products.length - 1 ? '1px solid var(--sand)' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: i === 0 ? '#C07800' : i === 1 ? '#888' : i === 2 ? '#A05030' : 'var(--sand)',
                        color: i < 3 ? '#fff' : 'var(--text-light)',
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.product_name}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tc-classic)' }}>{formatPrice(p.revenue || 0)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{p.qty} vente{p.qty !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Appareils */}
              <div className="eth-an-card eth-an-devices">
                <h6 className="eth-an-card-title" style={{ marginBottom: 20 }}>
                  <i className="fa-solid fa-mobile-screen me-2" style={{ color: 'var(--text-light)', fontSize: 13 }}></i>
                  Appareils
                </h6>
                {data.devices.length === 0 ? (
                  <p style={{ color: 'var(--text-light)', fontSize: 13 }}>—</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {data.devices.map((d) => {
                      const total = data.devices.reduce((s, x) => s + x.count, 0);
                      const pct = total ? Math.round(d.count / total * 100) : 0;
                      const color = deviceColors[d.device_type] || 'var(--text-mid)';
                      return (
                        <div key={d.device_type}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className={`fa-solid ${deviceIcons[d.device_type] || 'fa-display'}`} style={{ color, fontSize: 12 }}></i>
                              {deviceLabels[d.device_type] || d.device_type}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--sand)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width .6s ease' }}></div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 3 }}>{d.count} session{d.count !== 1 ? 's' : ''}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
