import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import MobileBackButton from '../../components/MobileBackButton';

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('');

  useEffect(() => {
    axiosInstance.get('/api/newsletter/subscribers/')
      .then(({ data }) => { setSubscribers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = subscribers.filter((s) =>
    !filter || s.universe === filter
  );

  const modeCount = subscribers.filter((s) => s.universe === 'mode').length;
  const bioCount  = subscribers.filter((s) => s.universe === 'bio').length;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/admin-dashboard" label="Dashboard" />
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Administration</p>
            <h1 className="eth-section-title">Newsletter <em>abonnés</em></h1>
          </div>
        </div>
      </div>

      <div className="eth-page-body">

        {/* Mini stats */}
        {!loading && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total', value: subscribers.length, color: 'var(--text-dark)', bg: 'var(--sand)' },
              { label: 'Mode',  value: modeCount,          color: 'var(--tc-classic)', bg: 'rgba(198,93,59,.1)' },
              { label: 'Bio',   value: bioCount,           color: 'var(--bio-main)',   bg: 'rgba(45,90,46,.1)' },
            ].map((s) => (
              <div key={s.label} style={{
                background: '#fff', border: '1px solid var(--sand)', borderRadius: 'var(--r-md)',
                padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r-sm)',
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fa-solid fa-envelope" style={{ color: s.color, fontSize: 14 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'Playfair Display, serif' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { val: '',     label: 'Tous' },
            { val: 'mode', label: 'Mode' },
            { val: 'bio',  label: 'Bio' },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => setFilter(opt.val)}
              style={{
                padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: `1px solid ${filter === opt.val ? 'var(--tc-classic)' : 'var(--sand)'}`,
                background: filter === opt.val ? 'var(--tc-classic)' : '#fff',
                color: filter === opt.val ? '#fff' : 'var(--text-mid)',
                cursor: 'pointer', transition: 'all .2s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--sand)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                {filtered.length} abonné{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="table-responsive">
              <table className="table eth-admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Univers</th>
                    <th>Date d'inscription</th>
                    <th>Actif</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ fontSize: 14, color: 'var(--text-dark)' }}>{s.email}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: s.universe === 'bio' ? 'rgba(45,90,46,.12)' : 'rgba(198,93,59,.12)',
                          color: s.universe === 'bio' ? 'var(--bio-main)' : 'var(--tc-classic)',
                        }}>
                          {s.universe === 'bio' ? 'Bio' : 'Mode'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                        {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        {s.is_active ? (
                          <i className="fa-solid fa-circle-check" style={{ color: 'var(--bio-main)', fontSize: 16 }}></i>
                        ) : (
                          <i className="fa-solid fa-circle-xmark" style={{ color: '#C0392B', fontSize: 16 }}></i>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px', fontSize: 14 }}>
                  Aucun abonné.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
