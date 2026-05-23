import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import MobileBackButton from '../../components/MobileBackButton';

function RequestDetailModal({ req, onClose, onToggleHandled }) {
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
        boxShadow: '0 24px 64px rgba(0,0,0,.2)', marginBottom: 32,
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--sand)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-light)' }}>
              Demande de produit
            </p>
            <h5 style={{ margin: '4px 0 0', fontFamily: 'Playfair Display, serif', fontSize: 18, color: 'var(--text-dark)' }}>
              {req.name || 'Visiteur anonyme'}
            </h5>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Expéditeur */}
          <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-user me-2"></i>Demandeur
            </p>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'var(--text-dark)' }}>
              {req.name || <em style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Non renseigné</em>}
            </p>
            {req.email ? (
              <a href={`mailto:${req.email}`} style={{ fontSize: 13, color: 'var(--tc-classic)', textDecoration: 'none' }}>
                <i className="fa-solid fa-envelope me-1"></i>{req.email}
              </a>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-light)', fontStyle: 'italic' }}>Pas d'email fourni</p>
            )}
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-light)' }}>
              {new Date(req.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-align-left me-2"></i>Description du produit recherché
            </p>
            <div style={{
              background: 'var(--cream)', borderRadius: 10, padding: '16px',
              fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.7,
              whiteSpace: 'pre-wrap', border: '1px solid var(--sand)',
            }}>
              {req.description}
            </div>
          </div>

          {/* Photo */}
          {req.photo && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
                <i className="fa-solid fa-image me-2"></i>Photo de référence
              </p>
              <a href={req.photo} target="_blank" rel="noreferrer">
                <img
                  src={req.photo}
                  alt="Photo de référence"
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 10, border: '1px solid var(--sand)', objectFit: 'contain', cursor: 'pointer' }}
                />
              </a>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-light)' }}>
                Cliquez sur l'image pour l'ouvrir en grand
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {req.email && (
              <a
                href={`mailto:${req.email}?subject=Votre demande de produit — EthniSpirit`}
                className="btn-eth-primary"
                style={{ padding: '10px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}
              >
                <i className="fa-solid fa-reply"></i>Répondre par email
              </a>
            )}
            <button
              onClick={() => onToggleHandled(req)}
              style={{
                padding: '10px 18px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: req.is_handled ? '1px solid rgba(45,90,46,.3)' : '1px solid rgba(198,93,59,.3)',
                background: req.is_handled ? 'rgba(45,90,46,.06)' : 'rgba(198,93,59,.06)',
                color: req.is_handled ? 'var(--bio-main)' : 'var(--tc-classic)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <i className={`fa-solid ${req.is_handled ? 'fa-rotate-left' : 'fa-circle-check'}`}></i>
              {req.is_handled ? 'Rouvrir la demande' : 'Marquer traitée'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductRequests() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');  // 'all' | 'pending' | 'handled'
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axiosInstance.get('/api/admin/product-requests/')
      .then(({ data }) => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleToggleHandled(req) {
    axiosInstance.patch(`/api/admin/product-requests/${req.id}/handle/`)
      .then(({ data }) => {
        setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, is_handled: data.is_handled } : r));
        setSelected((prev) => prev && prev.id === req.id ? { ...prev, is_handled: data.is_handled } : prev);
      })
      .catch(() => {});
  }

  const pendingCount = requests.filter((r) => !r.is_handled).length;

  const filtered = requests.filter((r) => {
    const matchFilter = filter === 'all'
      || (filter === 'pending' && !r.is_handled)
      || (filter === 'handled' && r.is_handled);
    const q = search.toLowerCase();
    const matchSearch = !search
      || (r.name  || '').toLowerCase().includes(q)
      || (r.email || '').toLowerCase().includes(q)
      || r.description.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/admin-dashboard" label="Dashboard" />

      {/* Header */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Administration</p>
            <h1 className="eth-section-title">Demandes de <em>produits</em></h1>
          </div>
        </div>
      </div>

      <div className="eth-page-body">

        {/* Stats */}
        {!loading && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total',    value: requests.length,              icon: 'fa-magnifying-glass-plus', color: '#2680C2',           bg: 'rgba(38,128,194,.1)' },
              { label: 'En attente', value: pendingCount,               icon: 'fa-clock',                color: 'var(--tc-classic)', bg: 'rgba(198,93,59,.1)' },
              { label: 'Traitées', value: requests.length - pendingCount, icon: 'fa-circle-check',        color: 'var(--bio-main)',   bg: 'rgba(45,90,46,.1)' },
            ].map((s) => (
              <div key={s.label} style={{
                background: '#fff', border: '1px solid var(--sand)', borderRadius: 'var(--r-md)',
                padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 14 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filtres + recherche */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-light)', fontSize: 13, pointerEvents: 'none',
            }}></i>
            <input
              type="search"
              className="form-control eth-input"
              style={{ paddingLeft: 38, width: 260 }}
              placeholder="Nom, email, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: 'all',     label: 'Toutes' },
              { val: 'pending', label: 'En attente' },
              { val: 'handled', label: 'Traitées' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setFilter(opt.val)}
                style={{
                  padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${filter === opt.val ? 'var(--tc-classic)' : 'var(--sand)'}`,
                  background: filter === opt.val ? 'var(--tc-classic)' : '#fff',
                  color: filter === opt.val ? '#fff' : 'var(--text-mid)', transition: 'all .2s',
                }}
              >
                {opt.label}
                {opt.val === 'pending' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 6,
                    background: filter === 'pending' ? 'rgba(255,255,255,.3)' : 'var(--tc-classic)',
                    color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11,
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--sand)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                {filtered.length} demande{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            {filtered.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px', fontSize: 14 }}>
                {requests.length === 0 ? 'Aucune demande reçue pour l\'instant.' : 'Aucun résultat.'}
              </p>
            ) : (
              <div>
                {filtered.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelected(req)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '14px 20px', cursor: 'pointer',
                      borderBottom: '1px solid var(--sand)',
                      background: req.is_handled ? '#fff' : 'rgba(198,93,59,.03)',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = req.is_handled ? '#fff' : 'rgba(198,93,59,.03)'}
                  >
                    {/* Indicateur statut */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: req.is_handled ? 'transparent' : 'var(--tc-classic)',
                      border: req.is_handled ? '1.5px solid var(--sand)' : 'none',
                    }}></div>

                    {/* Icône */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r-sm)', flexShrink: 0,
                      background: req.is_handled ? 'var(--sand)' : 'rgba(198,93,59,.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {req.photo ? (
                        <img
                          src={req.photo}
                          alt=""
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--r-sm)' }}
                        />
                      ) : (
                        <i
                          className="fa-solid fa-magnifying-glass-plus"
                          style={{ color: req.is_handled ? 'var(--text-light)' : 'var(--tc-classic)', fontSize: 15 }}
                        ></i>
                      )}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: req.is_handled ? 500 : 700, fontSize: 14, color: 'var(--text-dark)' }}>
                          {req.name || <em style={{ color: 'var(--text-light)', fontStyle: 'italic', fontWeight: 400 }}>Anonyme</em>}
                        </span>
                        {req.email && <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{req.email}</span>}
                      </div>
                      <div style={{
                        fontWeight: req.is_handled ? 400 : 500, fontSize: 13,
                        color: 'var(--text-mid)', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420,
                      }}>
                        {req.description}
                      </div>
                    </div>

                    {/* Date + badge statut */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                        {new Date(req.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: req.is_handled ? 'rgba(45,90,46,.1)' : 'rgba(198,93,59,.1)',
                        color: req.is_handled ? 'var(--bio-main)' : 'var(--tc-classic)',
                      }}>
                        {req.is_handled ? 'Traitée' : 'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal détail */}
      {selected && (
        <RequestDetailModal
          req={selected}
          onClose={() => setSelected(null)}
          onToggleHandled={handleToggleHandled}
        />
      )}
    </div>
  );
}
