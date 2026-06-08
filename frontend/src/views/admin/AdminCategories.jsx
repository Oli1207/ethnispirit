import { useEffect, useRef, useState } from 'react';
import { adminAPI, categoriesAPI } from '../../utils/api';
import MobileBackButton from '../../components/MobileBackButton';

const MAX_DISPLAY = 4; // slots affichés sur la homepage (0 → 3)

const EMPTY = { name: '', universe: 'mode', description: '', order: null };

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Retourne le slot libre le plus bas dans un ensemble de slots pris */
function nextFreeSlot(takenSet, exclude = null) {
  let i = 0;
  while (takenSet.has(i) && i !== exclude) i++;
  // Si exclude a libéré une place avant i, reprendre depuis 0
  for (let j = 0; j < i; j++) {
    if (!takenSet.has(j) || j === exclude) return j;
  }
  return i;
}

// ── Sélecteur de slot visuel ──────────────────────────────────────────────────
function SlotPicker({ value, universe, allCategories, currentId, onChange }) {
  // Catégories du même univers (hors celle qu'on modifie)
  const peers = allCategories.filter(c => c.universe === universe && c.id !== currentId);

  // Map order → catégorie occupante
  const occupied = {};
  peers.forEach(c => { if (c.order !== null && c.order !== undefined) occupied[c.order] = c; });

  // Quel slot est conflictuel ?
  const conflict = value !== null && value !== '' && occupied[value]
    ? occupied[value]
    : null;

  // Prochain slot libre si conflit
  const takenSet = new Set(peers.map(c => c.order).filter(o => o !== null));
  const displaced = conflict ? nextFreeSlot(takenSet, value) : null;

  const uColor   = universe === 'bio' ? 'var(--bio-main)' : 'var(--tc-classic)';
  const uBg      = universe === 'bio' ? 'rgba(45,90,46,.1)' : 'rgba(198,93,59,.1)';

  return (
    <div>
      {/* Grille de slots */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MAX_DISPLAY}, 1fr)`, gap: 8, marginBottom: 10 }}>
        {Array.from({ length: MAX_DISPLAY }, (_, i) => {
          const occ       = occupied[i];
          const isMe      = value === i;
          const isTaken   = Boolean(occ);
          const isConflict = isMe && isTaken;

          let bg, border, textColor, cursor;
          if (isMe && !isTaken) {
            bg = uBg; border = `2px solid ${uColor}`; textColor = uColor; cursor = 'default';
          } else if (isConflict) {
            bg = 'rgba(234,179,8,.12)'; border = '2px solid #D97706'; textColor = '#92400E'; cursor = 'pointer';
          } else if (isTaken) {
            bg = 'var(--cream)'; border = '1.5px solid var(--sand)'; textColor = 'var(--text-mid)'; cursor = 'pointer';
          } else {
            bg = '#fff'; border = '1.5px dashed var(--sand)'; textColor = 'var(--text-light)'; cursor = 'pointer';
          }

          return (
            <button
              key={i}
              type="button"
              title={occ ? `Occupé par : ${occ.name}` : `Libre`}
              onClick={() => onChange(i)}
              style={{
                padding: '10px 4px', borderRadius: 8, border, background: bg, cursor,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all .15s', minWidth: 0,
              }}
            >
              {/* Numéro de position */}
              <span style={{ fontSize: 11, fontWeight: 700, color: isMe && !isTaken ? uColor : 'var(--text-light)', lineHeight: 1 }}>
                #{i + 1}
              </span>
              {/* Nom ou état */}
              <span style={{
                fontSize: 10, fontWeight: 600, color: textColor, textAlign: 'center',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: '100%', lineHeight: 1.3,
              }}>
                {isMe && !isTaken ? '✓ Sélectionné' : isTaken ? occ.name : 'Libre'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: uBg, border: `1.5px solid ${uColor}`, display: 'inline-block' }} />
          Votre sélection
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--cream)', border: '1.5px solid var(--sand)', display: 'inline-block' }} />
          Occupé
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#fff', border: '1.5px dashed var(--sand)', display: 'inline-block' }} />
          Libre
        </span>
      </div>

      {/* Avertissement de conflit */}
      {conflict && (
        <div style={{
          background: 'rgba(234,179,8,.10)', border: '1px solid #D97706',
          borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400E',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginTop: 1, flexShrink: 0 }}></i>
          <span>
            La position&nbsp;<strong>#{value + 1}</strong> est déjà occupée par&nbsp;
            <strong>«&nbsp;{conflict.name}&nbsp;»</strong>.
            En enregistrant, <strong>«&nbsp;{conflict.name}&nbsp;»</strong> sera
            automatiquement déplacée vers la position <strong>#{displaced + 1}</strong> (prochaine libre).
          </span>
        </div>
      )}

      {/* Note limite */}
      <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8, marginBottom: 0 }}>
        <i className="fa-solid fa-circle-info me-1"></i>
        Seules les {MAX_DISPLAY} premières positions sont affichées sur la page d'accueil.
      </p>
    </div>
  );
}

// ── Modal Catégorie ───────────────────────────────────────────────────────────
function CategoryModal({ category, allCategories, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [form, setF] = useState(isEdit ? {
    name:        category.name,
    universe:    category.universe,
    description: category.description || '',
    order:       category.order ?? null,
  } : { ...EMPTY });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(isEdit ? category.image || null : null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const fileRef = useRef();

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  // Quand l'univers change, réinitialiser la position si elle crée un conflit inattendu
  function changeUniverse(u) {
    setF(prev => ({ ...prev, universe: u, order: null }));
  }

  function pickImage(e) {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    const r = new FileReader();
    r.onload = ev => setImagePreview(ev.target.result);
    r.readAsDataURL(f);
    e.target.value = '';
  }

  // Catégorie conflictuelle (même univers, même order, pas nous)
  const peers = allCategories.filter(c => c.universe === form.universe && c.id !== category?.id);
  const conflict = form.order !== null && peers.find(c => c.order === form.order) || null;
  const takenSet = new Set(peers.map(c => c.order).filter(o => o !== null));
  const displacedTo = conflict ? nextFreeSlot(takenSet, form.order) : null;

  async function save() {
    if (!form.name.trim()) return setError('Le nom est requis.');
    if (form.order === null || form.order === '') return setError('Choisissez une position d\'affichage.');
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null) fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);

      // 1. Sauvegarder la catégorie courante
      const saved = isEdit
        ? (await adminAPI.updateCategory(category.id, fd)).data
        : (await adminAPI.createCategory(fd)).data;

      // 2. Si conflit : déplacer l'autre catégorie vers son nouveau slot
      let updatedConflict = null;
      if (conflict) {
        const patchFd = new FormData();
        patchFd.append('order', displacedTo);
        await adminAPI.updateCategory(conflict.id, patchFd);
        updatedConflict = { ...conflict, order: displacedTo };
      }

      onSaved(saved, isEdit, updatedConflict);
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      zIndex: 1050, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500,
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 18 }}>
            {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-light)' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {error && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 13 }}>
              <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
            </div>
          )}

          {/* Nom */}
          <div style={{ marginBottom: 16 }}>
            <label className="eth-form-label">Nom de la catégorie *</label>
            <input className="form-control eth-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Robes, Huiles essentielles…" />
          </div>

          {/* Univers */}
          <div style={{ marginBottom: 16 }}>
            <label className="eth-form-label">Univers *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'mode', label: 'Mode Caribéenne', color: 'var(--tc-classic)', bg: 'rgba(198,93,59,.1)' },
                { val: 'bio',  label: 'Bio & Naturel',   color: 'var(--bio-main)',   bg: 'rgba(45,90,46,.1)'  },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => changeUniverse(opt.val)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${form.universe === opt.val ? opt.color : 'var(--sand)'}`,
                    background: form.universe === opt.val ? opt.bg : '#fff',
                    color: form.universe === opt.val ? opt.color : 'var(--text-mid)',
                    fontWeight: 600, fontSize: 13, transition: 'all .15s',
                  }}
                >
                  <i className={`fa-solid ${opt.val === 'bio' ? 'fa-seedling' : 'fa-shirt'} me-2`}></i>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position d'affichage — sélecteur visuel */}
          <div style={{ marginBottom: 16 }}>
            <label className="eth-form-label" style={{ marginBottom: 10, display: 'block' }}>
              Position sur la page d'accueil *
            </label>
            <SlotPicker
              value={form.order}
              universe={form.universe}
              allCategories={allCategories}
              currentId={category?.id}
              onChange={v => set('order', v)}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label className="eth-form-label">Description <span style={{ color: 'var(--text-light)', fontSize: 12 }}>optionnel</span></label>
            <textarea className="form-control eth-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description courte…" style={{ resize: 'vertical' }} />
          </div>

          {/* Image */}
          <div>
            <label className="eth-form-label">Image</label>
            {imagePreview && (
              <div style={{ marginBottom: 10, position: 'relative', width: 'fit-content' }}>
                <img src={imagePreview} alt="" style={{ height: 100, borderRadius: 8, objectFit: 'cover', maxWidth: 200, border: '1px solid var(--sand)' }} />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              style={{
                border: '2px dashed var(--sand)', background: 'var(--cream)',
                borderRadius: 8, padding: '9px 18px', cursor: 'pointer',
                color: 'var(--text-mid)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up"></i>
              {imagePreview ? 'Changer l\'image' : 'Choisir une image'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickImage} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--sand)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafaf9' }}>
          <button onClick={onClose} className="btn-eth-outline" style={{ padding: '10px 22px' }}>Annuler</button>
          <button onClick={save} disabled={saving} className="btn-eth-primary" style={{ padding: '10px 28px', minWidth: 120 }}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }}></span>Enregistrement…</>
              : (isEdit ? 'Enregistrer' : 'Créer')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirmation suppression ───────────────────────────────────────────────────
function DeleteConfirm({ label, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  async function go() { setBusy(true); await onConfirm(); setBusy(false); }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 360, width: '90%', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.2)' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <i className="fa-solid fa-trash" style={{ color: '#EF4444', fontSize: 20 }}></i>
        </div>
        <h6 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, marginBottom: 8 }}>Supprimer cette catégorie ?</h6>
        <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20 }}>
          <strong>{label}</strong> sera supprimée. Les produits associés perdront leur catégorie.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn-eth-outline" style={{ padding: '9px 22px' }}>Annuler</button>
          <button onClick={go} disabled={busy} style={{ padding: '9px 22px', borderRadius: 8, background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {busy ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Badge position ─────────────────────────────────────────────────────────────
function OrderBadge({ order, universe }) {
  if (order === null || order === undefined) return (
    <span style={{ fontSize: 11, color: 'var(--text-light)', fontStyle: 'italic' }}>Non placée</span>
  );
  const color = universe === 'bio' ? 'var(--bio-main)' : 'var(--tc-classic)';
  const bg    = universe === 'bio' ? 'rgba(45,90,46,.1)' : 'rgba(198,93,59,.1)';
  const isVisible = order < MAX_DISPLAY;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isVisible ? bg : 'rgba(0,0,0,.05)',
      color: isVisible ? color : 'var(--text-light)',
    }}>
      <i className={`fa-solid ${isVisible ? 'fa-eye' : 'fa-eye-slash'}`} style={{ fontSize: 9 }}></i>
      #{order + 1}
    </span>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('');
  const [modal,      setModal]      = useState(null);
  const [deleting,   setDeleting]   = useState(null);

  useEffect(() => {
    categoriesAPI.list()
      .then(({ data }) => { setCategories(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = categories.filter(c => !filter || c.universe === filter);

  function handleSaved(saved, isEdit, updatedConflict) {
    setCategories(prev => {
      let next = isEdit
        ? prev.map(c => c.id === saved.id ? saved : c)
        : [...prev, saved];
      // Appliquer le déplacement de la catégorie conflictuelle
      if (updatedConflict) {
        next = next.map(c => c.id === updatedConflict.id ? { ...c, order: updatedConflict.order } : c);
      }
      // Retrier par order
      return [...next].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    });
    setModal(null);
  }

  async function handleDelete(cat) {
    await adminAPI.deleteCategory(cat.id);
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    setDeleting(null);
  }

  // Compteurs par univers pour l'en-tête
  const modeCount = categories.filter(c => c.universe === 'mode').length;
  const bioCount  = categories.filter(c => c.universe === 'bio').length;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/admin-dashboard" label="Dashboard" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="eth-section-label">Administration</p>
            <h1 className="eth-section-title">Gestion des <em>catégories</em></h1>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                <i className="fa-solid fa-shirt me-1" style={{ color: 'var(--tc-classic)' }}></i>
                Mode : {modeCount}/{MAX_DISPLAY} slots
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                <i className="fa-solid fa-seedling me-1" style={{ color: 'var(--bio-main)' }}></i>
                Bio : {bioCount}/{MAX_DISPLAY} slots
              </span>
            </div>
          </div>
          <button onClick={() => setModal({ category: null })} className="btn-eth-primary" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-plus me-2"></i>Nouvelle catégorie
          </button>
        </div>
      </div>

      <div className="eth-page-body">
        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ val: '', label: 'Toutes' }, { val: 'mode', label: 'Mode' }, { val: 'bio', label: 'Bio' }].map(opt => (
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
            >{opt.label}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-light)', alignSelf: 'center' }}>
            {filtered.length} catégorie{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {filtered.map(cat => (
              <div key={cat.id} style={{
                background: '#fff', borderRadius: 'var(--r-lg)',
                border: cat.order < MAX_DISPLAY
                  ? `1px solid ${cat.universe === 'bio' ? 'rgba(45,90,46,.2)' : 'rgba(198,93,59,.2)'}`
                  : '1px solid var(--sand)',
                overflow: 'hidden', transition: 'box-shadow .2s',
              }}>
                {/* Image */}
                {cat.image ? (
                  <div style={{ height: 130, overflow: 'hidden' }}>
                    <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ height: 130, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-image" style={{ color: 'var(--text-light)', fontSize: 28 }}></i>
                  </div>
                )}

                {/* Infos */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h6 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 0, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                      {cat.name}
                    </h6>
                    <OrderBadge order={cat.order} universe={cat.universe} />
                  </div>

                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: cat.universe === 'bio' ? 'rgba(45,90,46,.12)' : 'rgba(198,93,59,.12)',
                    color: cat.universe === 'bio' ? 'var(--bio-main)' : 'var(--tc-classic)',
                  }}>
                    {cat.universe === 'bio' ? '🌿 Bio' : '✨ Mode'}
                  </span>

                  {cat.subcategories?.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-light)' }}>
                      <i className="fa-solid fa-sitemap me-1"></i>
                      {cat.subcategories.length} sous-catégorie{cat.subcategories.length > 1 ? 's' : ''}
                    </div>
                  )}

                  {cat.product_count > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-light)' }}>
                      <i className="fa-solid fa-box me-1"></i>
                      {cat.product_count} produit{cat.product_count > 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => setModal({ category: cat })}
                      className="btn-eth-outline"
                      style={{ flex: 1, padding: '7px 0', fontSize: 13 }}
                    >
                      <i className="fa-solid fa-pen me-1"></i>Modifier
                    </button>
                    <button
                      onClick={() => setDeleting(cat)}
                      style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', color: '#EF4444', cursor: 'pointer', fontSize: 13 }}
                      title="Supprimer"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-light)', padding: '40px', fontSize: 14 }}>
                Aucune catégorie.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {modal !== null && (
        <CategoryModal
          category={modal.category}
          allCategories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label={deleting.name}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
