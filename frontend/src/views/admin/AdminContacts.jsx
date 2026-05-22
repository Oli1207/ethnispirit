import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import MobileBackButton from '../../components/MobileBackButton';

function ContactDetailModal({ msg, onClose, onToggleRead, onDelete }) {
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
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600,
        boxShadow: '0 24px 64px rgba(0,0,0,.2)', marginBottom: 32,
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--sand)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-light)' }}>Message de contact</p>
            <h5 style={{ margin: '4px 0 0', fontFamily: 'Playfair Display, serif', fontSize: 18, color: 'var(--text-dark)' }}>{msg.subject}</h5>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Expéditeur */}
          <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-user me-2"></i>Expéditeur
            </p>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'var(--text-dark)' }}>{msg.name}</p>
            <a href={`mailto:${msg.email}`} style={{ fontSize: 13, color: 'var(--tc-classic)', textDecoration: 'none' }}>
              <i className="fa-solid fa-envelope me-1"></i>{msg.email}
            </a>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-light)' }}>
              {new Date(msg.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Message */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-comment me-2"></i>Message
            </p>
            <div style={{
              background: 'var(--cream)', borderRadius: 10, padding: '16px',
              fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.7,
              whiteSpace: 'pre-wrap', border: '1px solid var(--sand)',
            }}>
              {msg.message}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
              className="btn-eth-primary"
              style={{ padding: '10px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}
            >
              <i className="fa-solid fa-reply"></i>Répondre par email
            </a>
            <button
              onClick={() => onToggleRead(msg)}
              style={{
                padding: '10px 18px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid var(--sand)', background: '#fff', color: 'var(--text-mid)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <i className={`fa-solid ${msg.is_read ? 'fa-envelope' : 'fa-envelope-open'}`}></i>
              {msg.is_read ? 'Marquer non lu' : 'Marquer lu'}
            </button>
            <button
              onClick={() => onDelete(msg)}
              style={{
                padding: '10px 18px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid rgba(192,57,43,.3)', background: 'rgba(192,57,43,.06)', color: '#C0392B',
                display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto',
              }}
            >
              <i className="fa-solid fa-trash"></i>Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminContacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');   // 'all' | 'unread' | 'read'
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axiosInstance.get('/api/admin/contacts/')
      .then(({ data }) => { setMessages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleToggleRead(msg) {
    axiosInstance.patch(`/api/admin/contacts/${msg.id}/read/`)
      .then(({ data }) => {
        setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: data.is_read } : m));
        setSelected((prev) => prev && prev.id === msg.id ? { ...prev, is_read: data.is_read } : prev);
      })
      .catch(() => {});
  }

  function handleDelete(msg) {
    if (!window.confirm(`Supprimer le message de ${msg.name} ?`)) return;
    axiosInstance.delete(`/api/admin/contacts/${msg.id}/delete/`)
      .then(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        setSelected(null);
      })
      .catch(() => {});
  }

  function openMsg(msg) {
    setSelected(msg);
    // Marquer automatiquement comme lu à l'ouverture
    if (!msg.is_read) {
      axiosInstance.patch(`/api/admin/contacts/${msg.id}/read/`)
        .then(({ data }) => {
          setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: data.is_read } : m));
          setSelected((prev) => prev && prev.id === msg.id ? { ...prev, is_read: data.is_read } : prev);
        })
        .catch(() => {});
    }
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const filtered = messages.filter((m) => {
    const matchFilter = filter === 'all' || (filter === 'unread' && !m.is_read) || (filter === 'read' && m.is_read);
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
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
            <h1 className="eth-section-title">Messages de <em>contact</em></h1>
          </div>
        </div>
      </div>

      <div className="eth-page-body">

        {/* Stats */}
        {!loading && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total',   value: messages.length, icon: 'fa-comments',      color: '#2680C2',          bg: 'rgba(38,128,194,.1)' },
              { label: 'Non lus', value: unreadCount,     icon: 'fa-envelope',      color: 'var(--tc-classic)', bg: 'rgba(198,93,59,.1)' },
              { label: 'Traités', value: messages.length - unreadCount, icon: 'fa-envelope-open', color: 'var(--bio-main)', bg: 'rgba(45,90,46,.1)' },
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

        {/* Filtres */}
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
              placeholder="Nom, email, sujet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: 'all',    label: 'Tous' },
              { val: 'unread', label: 'Non lus' },
              { val: 'read',   label: 'Lus' },
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
                {opt.val === 'unread' && unreadCount > 0 && (
                  <span style={{
                    marginLeft: 6, background: filter === 'unread' ? 'rgba(255,255,255,.3)' : 'var(--tc-classic)',
                    color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--sand)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                {filtered.length} message{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            {filtered.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px', fontSize: 14 }}>
                Aucun message.
              </p>
            ) : (
              <div>
                {filtered.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => openMsg(msg)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '14px 20px', cursor: 'pointer',
                      borderBottom: '1px solid var(--sand)',
                      background: msg.is_read ? '#fff' : 'rgba(198,93,59,.03)',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = msg.is_read ? '#fff' : 'rgba(198,93,59,.03)'}
                  >
                    {/* Indicateur lu/non-lu */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: msg.is_read ? 'transparent' : 'var(--tc-classic)',
                      border: msg.is_read ? '1.5px solid var(--sand)' : 'none',
                    }}></div>

                    {/* Icône */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r-sm)', flexShrink: 0,
                      background: msg.is_read ? 'var(--sand)' : 'rgba(198,93,59,.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i
                        className={`fa-solid ${msg.is_read ? 'fa-envelope-open' : 'fa-envelope'}`}
                        style={{ color: msg.is_read ? 'var(--text-light)' : 'var(--tc-classic)', fontSize: 15 }}
                      ></i>
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: msg.is_read ? 500 : 700, fontSize: 14, color: 'var(--text-dark)' }}>
                          {msg.name}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{msg.email}</span>
                      </div>
                      <div style={{
                        fontWeight: msg.is_read ? 400 : 600, fontSize: 13,
                        color: msg.is_read ? 'var(--text-mid)' : 'var(--text-dark)',
                        marginTop: 2,
                      }}>
                        {msg.subject}
                      </div>
                      <div style={{
                        fontSize: 12, color: 'var(--text-light)', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400,
                      }}>
                        {msg.message}
                      </div>
                    </div>

                    {/* Date + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                        {new Date(msg.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleRead(msg)}
                          title={msg.is_read ? 'Marquer non lu' : 'Marquer lu'}
                          style={{
                            background: 'var(--cream)', border: '1px solid var(--sand)',
                            borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12,
                            color: 'var(--text-mid)',
                          }}
                        >
                          <i className={`fa-solid ${msg.is_read ? 'fa-envelope' : 'fa-envelope-open'}`}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(msg)}
                          title="Supprimer"
                          style={{
                            background: 'rgba(192,57,43,.06)', border: '1px solid rgba(192,57,43,.2)',
                            borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12,
                            color: '#C0392B',
                          }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
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
        <ContactDetailModal
          msg={selected}
          onClose={() => setSelected(null)}
          onToggleRead={handleToggleRead}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
