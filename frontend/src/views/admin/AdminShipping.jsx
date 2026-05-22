import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';
import MobileBackButton from '../../components/MobileBackButton';

const EMPTY = { name: '', destinations: '', cost: '', free_above: '0', days_min: '3', days_max: '7', is_active: true };

const PRESETS = [
  { name: 'Martinique', destinations: 'Martinique, Fort-de-France, Le Lamentin, Schoelcher', cost: '6.00', free_above: '80.00', days_min: '3', days_max: '5' },
  { name: 'Guadeloupe', destinations: 'Guadeloupe, Pointe-à-Pitre, Basse-Terre',             cost: '6.00', free_above: '80.00', days_min: '3', days_max: '5' },
  { name: 'Caraïbes & DOM',   destinations: 'Saint-Martin, Saint-Barthélemy, La Réunion, Mayotte, Guyane', cost: '10.00', free_above: '120.00', days_min: '5', days_max: '8' },
  { name: 'France métropole', destinations: 'Île-de-France, Autre (France métropolitaine)',  cost: '8.50',  free_above: '90.00',  days_min: '3', days_max: '5' },
];

function ZoneModal({ zone, onClose, onSaved }) {
  const isEdit    = Boolean(zone);
  const [form, setF] = useState(isEdit ? {
    name:         zone.name,
    destinations: zone.destinations,
    cost:         zone.cost,
    free_above:   zone.free_above,
    days_min:     zone.days_min,
    days_max:     zone.days_max,
    is_active:    zone.is_active,
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  function applyPreset(preset) {
    setF(prev => ({ ...prev, ...preset, is_active: true }));
  }

  async function save() {
    if (!form.name.trim())         return setError('Le nom est requis.');
    if (!form.destinations.trim()) return setError('Au moins une destination est requise.');
    if (!form.cost)                return setError('Le coût est requis.');
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        cost:       parseFloat(form.cost),
        free_above: parseFloat(form.free_above || 0),
        days_min:   parseInt(form.days_min),
        days_max:   parseInt(form.days_max),
      };
      const { data } = isEdit
        ? await axiosInstance.patch(`/api/admin/shipping/${zone.id}/update/`, payload)
        : await axiosInstance.post('/api/admin/shipping/create/', payload);
      onSaved(data, isEdit);
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Erreur lors de l\'enregistrement.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h5 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 18 }}>
            {isEdit ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
          </h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-light)' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          {error && <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 13 }}><i className="fa-solid fa-circle-exclamation me-2"></i>{error}</div>}

          {/* Modèles rapides */}
          {!isEdit && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Modèles rapides</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, border: '1px solid var(--tc-classic)', background: 'rgba(198,93,59,.06)', color: 'var(--tc-classic)', cursor: 'pointer', fontWeight: 600 }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Nom */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="eth-form-label">Nom de la zone *</label>
              <input className="form-control eth-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Martinique" />
            </div>

            {/* Destinations */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="eth-form-label">Destinations (séparées par des virgules) *</label>
              <textarea className="form-control eth-input" rows={2} value={form.destinations} onChange={e => set('destinations', e.target.value)} placeholder="Martinique, Fort-de-France, Le Lamentin…" style={{ resize: 'vertical' }} />
              <small style={{ color: 'var(--text-light)', fontSize: 11 }}>Ces valeurs sont comparées à ce que l'utilisateur saisit comme pays/ville à la commande.</small>
            </div>

            {/* Coût */}
            <div>
              <label className="eth-form-label">Coût (€) *</label>
              <input type="number" min="0" step="0.01" className="form-control eth-input" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="6.00" />
            </div>

            {/* Gratuit dès */}
            <div>
              <label className="eth-form-label">Gratuite dès (€)</label>
              <input type="number" min="0" step="0.01" className="form-control eth-input" value={form.free_above} onChange={e => set('free_above', e.target.value)} placeholder="80.00" />
              <small style={{ color: 'var(--text-light)', fontSize: 11 }}>0 = jamais gratuite</small>
            </div>

            {/* Délai min */}
            <div>
              <label className="eth-form-label">Délai min (jours)</label>
              <input type="number" min="1" className="form-control eth-input" value={form.days_min} onChange={e => set('days_min', e.target.value)} />
            </div>

            {/* Délai max */}
            <div>
              <label className="eth-form-label">Délai max (jours)</label>
              <input type="number" min="1" className="form-control eth-input" value={form.days_max} onChange={e => set('days_max', e.target.value)} />
            </div>

            {/* Actif */}
            <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="zone-active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="zone-active" style={{ fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>Zone active (utilisée lors des commandes)</label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--sand)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafaf9', flexShrink: 0 }}>
          <button onClick={onClose} className="btn-eth-outline" style={{ padding: '10px 22px' }}>Annuler</button>
          <button onClick={save} disabled={saving} className="btn-eth-primary" style={{ padding: '10px 28px', minWidth: 120 }}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }}></span>Enregistrement…</> : (isEdit ? 'Enregistrer' : 'Créer la zone')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShipping() {
  const [zones,    setZones]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    axiosInstance.get('/api/admin/shipping/')
      .then(({ data }) => { setZones(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleSaved(saved, isEdit) {
    setZones(prev => isEdit ? prev.map(z => z.id === saved.id ? saved : z) : [...prev, saved]);
    setModal(null);
  }

  async function handleDelete(zone) {
    await axiosInstance.delete(`/api/admin/shipping/${zone.id}/delete/`);
    setZones(prev => prev.filter(z => z.id !== zone.id));
    setDeleting(null);
  }

  async function toggleActive(zone) {
    try {
      const { data } = await axiosInstance.patch(`/api/admin/shipping/${zone.id}/update/`, { is_active: !zone.is_active });
      setZones(prev => prev.map(z => z.id === data.id ? data : z));
    } catch { /* silent */ }
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/admin-dashboard" label="Dashboard" />
      <div className="eth-page-header">
        <div className="eth-page-header-inner" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="eth-section-label">Administration</p>
            <h1 className="eth-section-title">Zones de <em>livraison</em></h1>
          </div>
          <button onClick={() => setModal({ zone: null })} className="btn-eth-primary" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-plus me-2"></i>Nouvelle zone
          </button>
        </div>
      </div>

      <div className="eth-page-body">
        {/* Info */}
        <div style={{ background: 'rgba(198,93,59,.06)', border: '1px solid rgba(198,93,59,.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--text-mid)' }}>
          <i className="fa-solid fa-circle-info me-2" style={{ color: 'var(--tc-classic)' }}></i>
          Les zones sont automatiquement associées selon la destination saisie par le client. Si aucune zone ne correspond, un tarif de secours est appliqué.
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}><div className="spinner-border eth-spinner"></div></div>
        ) : zones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
            <i className="fa-solid fa-truck-fast" style={{ fontSize: 32, marginBottom: 12, display: 'block' }}></i>
            <p style={{ fontSize: 14 }}>Aucune zone configurée. Utilise les <strong>modèles rapides</strong> pour démarrer.</p>
            <button onClick={() => setModal({ zone: null })} className="btn-eth-primary" style={{ marginTop: 16, padding: '10px 24px' }}>
              <i className="fa-solid fa-plus me-2"></i>Créer une zone
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {zones.map(zone => (
              <div key={zone.id} style={{
                background: '#fff', borderRadius: 'var(--r-lg)', border: `1px solid ${zone.is_active ? 'var(--sand)' : '#E5E7EB'}`,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                opacity: zone.is_active ? 1 : .55,
              }}>
                {/* Icône */}
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(198,93,59,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fa-solid fa-truck-fast" style={{ color: 'var(--tc-classic)', fontSize: 18 }}></i>
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <strong style={{ fontSize: 15, color: 'var(--text-dark)' }}>{zone.name}</strong>
                    {!zone.is_active && <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>INACTIF</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <i className="fa-solid fa-location-dot me-1"></i>{zone.destinations}
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                    <span style={{ color: 'var(--tc-classic)', fontWeight: 700 }}>{parseFloat(zone.cost).toFixed(2)} €</span>
                    {parseFloat(zone.free_above) > 0 && <span style={{ color: 'var(--bio-main)' }}><i className="fa-solid fa-gift me-1"></i>Gratuit dès {parseFloat(zone.free_above).toFixed(2)} €</span>}
                    <span style={{ color: 'var(--text-mid)' }}><i className="fa-regular fa-clock me-1"></i>{zone.days_min}–{zone.days_max} jours</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <button
                    onClick={() => toggleActive(zone)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${zone.is_active ? '#D1FAE5' : 'var(--sand)'}`,
                      background: zone.is_active ? '#ECFDF5' : '#F9FAFB',
                      color: zone.is_active ? '#065F46' : '#6B7280',
                      cursor: 'pointer',
                    }}
                    title={zone.is_active ? 'Désactiver' : 'Activer'}
                  >
                    <i className={`fa-solid ${zone.is_active ? 'fa-toggle-on' : 'fa-toggle-off'} me-1`}></i>
                    {zone.is_active ? 'Actif' : 'Inactif'}
                  </button>
                  <button onClick={() => setModal({ zone })} className="btn-eth-outline" style={{ padding: '6px 12px', fontSize: 13 }} title="Modifier">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => setDeleting(zone)} style={{ padding: '6px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', color: '#EF4444', cursor: 'pointer' }} title="Supprimer">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <ZoneModal
          zone={modal.zone}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 360, width: '90%', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.2)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <i className="fa-solid fa-trash" style={{ color: '#EF4444', fontSize: 20 }}></i>
            </div>
            <h6 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, marginBottom: 8 }}>Supprimer la zone ?</h6>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20 }}><strong>{deleting.name}</strong> sera supprimée définitivement.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleting(null)} className="btn-eth-outline" style={{ padding: '9px 22px' }}>Annuler</button>
              <button onClick={() => handleDelete(deleting)} style={{ padding: '9px 22px', borderRadius: 8, background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
