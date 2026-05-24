import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import MobileBackButton from '../../components/MobileBackButton';

const EMPTY = {
  code: '', discount_type: 'percent', discount_value: '',
  universe: 'all', min_order: '0', max_uses: '0',
  valid_from: '', valid_until: '', is_active: true,
};

const UNIVERSE_LABELS = {
  all:  { label: 'Tous les univers', color: 'var(--text-mid)',    bg: 'var(--cream)' },
  mode: { label: 'Mode Caribéenne',  color: 'var(--tc-classic)',  bg: 'rgba(198,93,59,.1)' },
  bio:  { label: 'Bio & Naturel',    color: 'var(--bio-main)',    bg: 'rgba(45,90,46,.1)' },
};

function toInputDate(iso) {
  if (!iso) return '';
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

// ── Modal création / édition ─────────────────────────────────────────────────
function PromoModal({ promo, onClose, onSaved }) {
  const isEdit = Boolean(promo);
  const [form, setF] = useState(isEdit ? {
    code:           promo.code,
    discount_type:  promo.discount_type,
    discount_value: promo.discount_value,
    universe:       promo.universe || 'all',
    min_order:      promo.min_order,
    max_uses:       promo.max_uses,
    valid_from:     toInputDate(promo.valid_from),
    valid_until:    toInputDate(promo.valid_until),
    is_active:      promo.is_active,
  } : { ...EMPTY });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  async function save() {
    if (!form.code.trim())        return setError('Le code est requis.');
    if (!form.discount_value)     return setError('La valeur de réduction est requise.');
    if (!form.valid_from)         return setError('La date de début est requise.');
    if (!form.valid_until)        return setError('La date de fin est requise.');
    if (form.valid_until <= form.valid_from) return setError('La date de fin doit être après la date de début.');
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        valid_from:  new Date(form.valid_from).toISOString(),
        valid_until: new Date(form.valid_until).toISOString(),
      };
      const res = isEdit
        ? await axiosInstance.patch(`/api/admin/promo/${promo.id}/update/`, payload)
        : await axiosInstance.post('/api/admin/promo/create/', payload);
      onSaved(res.data, isEdit);
    } catch (err) {
      const data = err.response?.data;
      if (data?.error) setError(data.error);
      else if (data) setError(Object.values(data).flat().join(' '));
      else setError('Erreur lors de l\'enregistrement.');
    } finally { setSaving(false); }
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid var(--sand)', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, outline: 'none', background: '#fff',
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-mid)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '.06em' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 18 }}>
            {isEdit ? 'Modifier le code promo' : 'Nouveau code promo'}
          </h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {error && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 13, display: 'flex', gap: 8 }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginTop: 2, flexShrink: 0 }}></i>
              <span>{error}</span>
            </div>
          )}

          {/* Code */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Code promo ✱</label>
            <input
              style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.05em' }}
              value={form.code}
              onChange={(e) => set('code', e.target.value)}
              placeholder="EX: SUMMER20"
              maxLength={50}
            />
          </div>

          {/* Type + valeur */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Type de réduction ✱</label>
              <select style={inputStyle} value={form.discount_type} onChange={(e) => set('discount_type', e.target.value)}>
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (€)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Valeur ✱</label>
              <input
                type="number" min="0" step="0.01"
                style={inputStyle}
                value={form.discount_value}
                onChange={(e) => set('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percent' ? 'ex: 15' : 'ex: 10.00'}
              />
            </div>
          </div>

          {/* Univers */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Univers d'application</label>
            <select style={inputStyle} value={form.universe} onChange={(e) => set('universe', e.target.value)}>
              <option value="all">Tous les univers</option>
              <option value="mode">Mode Caribéenne uniquement</option>
              <option value="bio">Bio & Naturel uniquement</option>
            </select>
            <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4, marginBottom: 0 }}>
              {form.universe === 'all'  && 'S\'applique sur le total de la commande (Mode + Bio).'}
              {form.universe === 'mode' && 'Ne réduit que les articles Mode Caribéenne. Cumulable avec un code Bio.'}
              {form.universe === 'bio'  && 'Ne réduit que les articles Bio & Naturel. Cumulable avec un code Mode.'}
            </p>
          </div>

          {/* Minimum commande + nb utilisations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Commande min. (€)</label>
              <input type="number" min="0" step="0.01" style={inputStyle} value={form.min_order} onChange={(e) => set('min_order', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Nb. utilisations max</label>
              <input type="number" min="0" style={inputStyle} value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} placeholder="0 = illimité" />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Début ✱</label>
              <input type="datetime-local" style={inputStyle} value={form.valid_from} onChange={(e) => set('valid_from', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Fin ✱</label>
              <input type="datetime-local" style={inputStyle} value={form.valid_until} onChange={(e) => set('valid_until', e.target.value)} />
            </div>
          </div>

          {/* Actif */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <button
              onClick={() => set('is_active', !form.is_active)}
              style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: form.is_active ? 'var(--bio-main)' : '#CBD5E0', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', top: 3, left: form.is_active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)' }}>Code actif</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid var(--sand)', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-mid)' }}>
              Annuler
            </button>
            <button
              onClick={save} disabled={saving}
              style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: 'var(--tc-classic)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: saving ? .7 : 1 }}
            >
              {saving ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer le code')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section Modal de bienvenue ────────────────────────────────────────────────
const WM_EMPTY = {
  is_active: true, universe: 'all', title: '', subtitle: '', promo_code: '',
  discount_text: '', body_text: '', delay_seconds: 3,
};

function WelcomeModalEditor() {
  const [form,    setForm]    = useState(WM_EMPTY);
  const [loaded,  setLoaded]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    axiosInstance.get('/api/welcome-promo/')
      .then(({ data }) => { setForm(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.promo_code.trim()) return setError('Le code promo est requis.');
    setError(''); setSaving(true);
    try {
      await axiosInstance.patch('/api/admin/welcome-promo/', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  }

  const inp = {
    width: '100%', border: '1.5px solid var(--sand)', borderRadius: 10,
    padding: '9px 13px', fontSize: 13, background: '#fff',
    color: 'var(--text-dark)', outline: 'none',
  };

  if (!loaded) return (
    <div style={{ padding: '20px 0', textAlign: 'center' }}>
      <div className="spinner-border eth-spinner" style={{ width: 22, height: 22 }}></div>
    </div>
  );

  return (
    <div style={{ background: '#fff', border: '1px solid var(--sand)', borderRadius: 'var(--r-lg)', padding: '24px', marginBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(198,93,59,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-gift" style={{ color: 'var(--tc-classic)', fontSize: 15 }}></i>
          </div>
          <div>
            <h6 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, margin: 0, color: 'var(--text-dark)' }}>Modal de bienvenue</h6>
            <p style={{ fontSize: 11, color: 'var(--text-light)', margin: 0 }}>Affiché aux nouveaux visiteurs après {form.delay_seconds}s</p>
          </div>
        </div>
        {/* Toggle actif/inactif */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: form.is_active ? 'var(--bio-main)' : 'var(--text-light)' }}>
          <div
            onClick={() => set('is_active', !form.is_active)}
            style={{
              width: 42, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'background .2s',
              background: form.is_active ? 'var(--bio-main)' : 'var(--sand)', position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: form.is_active ? 21 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }} />
          </div>
          {form.is_active ? 'Actif' : 'Inactif'}
        </label>
      </div>

      {/* Grille champs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Titre du modal</label>
          <input style={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Bienvenue !" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Sous-titre</label>
          <input style={inp} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="1ère commande" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Code promo *</label>
          <input style={{ ...inp, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }} value={form.promo_code} onChange={e => set('promo_code', e.target.value.toUpperCase())} placeholder="ETHNI10" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Texte réduction</label>
          <input style={inp} value={form.discount_text} onChange={e => set('discount_text', e.target.value)} placeholder="10% de réduction" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Affiché sur</label>
          <select style={inp} value={form.universe} onChange={e => set('universe', e.target.value)}>
            <option value="all">Tous les univers</option>
            <option value="mode">Mode Caribéenne uniquement</option>
            <option value="bio">Bio & Naturel uniquement</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Délai avant affichage (s)</label>
          <input style={inp} type="number" min={0} max={30} value={form.delay_seconds} onChange={e => set('delay_seconds', parseInt(e.target.value) || 0)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Texte complémentaire (facultatif)</label>
          <textarea style={{ ...inp, resize: 'vertical', minHeight: 56 }} value={form.body_text} onChange={e => set('body_text', e.target.value)} placeholder="Profitez de ce code exclusif pour votre première commande…" rows={2} />
        </div>
      </div>

      {error && <p style={{ color: '#E53E3E', fontSize: 12, marginTop: 10, marginBottom: 0 }}><i className="fa-solid fa-circle-exclamation me-1"></i>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '9px 24px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 700,
            background: saved ? 'var(--bio-main)' : 'var(--tc-classic)', color: '#fff',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .2s',
            opacity: saving ? .7 : 1, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {saving ? <><span className="spinner-border spinner-border-sm"></span> Sauvegarde…</> :
           saved   ? <><i className="fa-solid fa-check"></i> Sauvegardé !</> :
                     <><i className="fa-solid fa-floppy-disk"></i> Sauvegarder</>}
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminPromoCodes() {
  const [promos, setPromos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'create' | promo obj
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast]       = useState('');

  useEffect(() => {
    axiosInstance.get('/api/admin/promo/')
      .then(({ data }) => { setPromos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleSaved(saved, isEdit) {
    setPromos(prev => isEdit ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]);
    setModal(null);
    showToast(isEdit ? 'Code mis à jour ✓' : 'Code créé ✓');
  }

  async function handleToggle(promo) {
    try {
      const { data } = await axiosInstance.patch(`/api/admin/promo/${promo.id}/update/`, { is_active: !promo.is_active });
      setPromos(prev => prev.map(p => p.id === data.id ? data : p));
    } catch {}
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await axiosInstance.delete(`/api/admin/promo/${id}/delete/`);
      setPromos(prev => prev.filter(p => p.id !== id));
      showToast('Code supprimé');
    } catch {
      showToast('Impossible de supprimer ce code.');
    } finally { setDeleting(null); }
  }

  function formatDiscount(p) {
    return p.discount_type === 'percent'
      ? `−${p.discount_value}%`
      : `−${parseFloat(p.discount_value).toFixed(2)} €`;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/admin-dashboard" label="Dashboard" />
      {/* Header */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Administration</p>
            <h1 className="eth-section-title">Codes <em>promo</em></h1>
          </div>
          <button
            onClick={() => setModal('create')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: 'var(--tc-classic)' }}
          >
            <i className="fa-solid fa-plus"></i> Nouveau code
          </button>
        </div>
      </div>

      <div className="eth-page-body">

        {/* ── Modal de bienvenue ─────────────────────────────────────────── */}
        <WelcomeModalEditor />

        {/* ── Codes promo ───────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : promos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-light)' }}>
            <i className="fa-solid fa-tag fa-3x mb-3" style={{ display: 'block', marginBottom: 16 }}></i>
            <p style={{ fontWeight: 600, fontSize: 16 }}>Aucun code promo créé</p>
            <button onClick={() => setModal('create')} className="btn-eth-primary mt-3" style={{ marginTop: 16 }}>
              <i className="fa-solid fa-plus me-2"></i>Créer le premier code
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                {promos.length} code{promos.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="table-responsive">
              <table className="table eth-admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Réduction</th>
                    <th>Univers</th>
                    <th>Min. commande</th>
                    <th>Utilisations</th>
                    <th>Validité</th>
                    <th>Statut</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--text-dark)', letterSpacing: '.05em', background: 'var(--cream)', padding: '3px 10px', borderRadius: 6 }}>
                          {p.code}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--tc-classic)' }}>
                          {formatDiscount(p)}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const u = UNIVERSE_LABELS[p.universe] || UNIVERSE_LABELS.all;
                          return (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: u.bg, color: u.color }}>
                              {u.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                        {parseFloat(p.min_order) > 0 ? `${parseFloat(p.min_order).toFixed(2)} €` : '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{p.used_count}</span>
                        {p.max_uses > 0 && <span style={{ color: 'var(--text-light)' }}> / {p.max_uses}</span>}
                        {p.max_uses === 0 && <span style={{ color: 'var(--text-light)' }}> / ∞</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                        <div>{formatDate(p.valid_from)}</div>
                        <div style={{ color: 'var(--text-light)' }}>→ {formatDate(p.valid_until)}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => handleToggle(p)}
                            style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: p.is_active ? 'var(--bio-main)' : '#CBD5E0', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
                          >
                            <span style={{ position: 'absolute', top: 2, left: p.is_active ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                          </button>
                          <span style={{ fontSize: 11, fontWeight: 700, color: p.is_active ? 'var(--bio-main)' : 'var(--text-light)' }}>
                            {p.is_active ? (p.is_valid_now ? 'Actif' : 'Expiré') : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setModal(p)}
                            style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--sand)', background: '#fff', cursor: 'pointer', fontSize: 12, color: 'var(--text-mid)' }}
                            title="Modifier"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FFF5F5', cursor: 'pointer', fontSize: 12, color: '#C0392B', opacity: deleting === p.id ? .5 : 1 }}
                            title="Supprimer"
                          >
                            <i className={`fa-solid ${deleting === p.id ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <PromoModal
          promo={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: 'var(--text-dark)', color: '#fff',
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,.2)', zIndex: 2000,
          animation: 'fadeIn .2s ease',
        }}>
          <i className="fa-solid fa-check-circle me-2" style={{ color: '#68D391' }}></i>
          {toast}
        </div>
      )}
    </div>
  );
}
