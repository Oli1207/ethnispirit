import { useEffect, useRef, useState } from 'react';
import { adminAPI, categoriesAPI } from '../../utils/api';
import { formatPrice } from '../../utils/currency';
import MobileBackButton from '../../components/MobileBackButton';

// ── Panneau alertes de stock ───────────────────────────────────────────────────
function StockAlertsPanel() {
  const [settings, setSettings]       = useState(null);
  const [threshold, setThreshold]     = useState('');
  const [email, setEmail]             = useState('');
  const [isActive, setIsActive]       = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saveOk, setSaveOk]           = useState(false);
  const [notifications, setNotifs]    = useState([]);
  const [open, setOpen]               = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([adminAPI.stockAlerts(), adminAPI.restockNotifications()])
      .then(([sa, rn]) => {
        setSettings(sa.data);
        setThreshold(String(sa.data.threshold ?? 5));
        setEmail(sa.data.email || '');
        setIsActive(sa.data.is_active ?? true);
        setNotifs(rn.data);
      })
      .catch(() => {});
  }, [open]);

  async function handleSave() {
    setSaving(true);
    setSaveOk(false);
    try {
      const { data } = await adminAPI.updateStockAlerts({
        threshold: parseInt(threshold, 10) || 5,
        email,
        is_active: isActive,
      });
      setSettings(data);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  const lowStock = notifications.filter(n => !n.notified);
  const notified = notifications.filter(n => n.notified);

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--r-lg)',
      border: '1px solid var(--sand)', marginTop: 28, overflow: 'hidden',
    }}>
      {/* Titre cliquable */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '18px 24px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(230,160,32,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-bell" style={{ color: '#C07800', fontSize: 15 }}></i>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-dark)' }}>Alertes de stock</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>Notifications e-mail + demandes de réapprovisionnement clients</p>
          </div>
        </div>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--text-light)', fontSize: 13 }}></i>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--sand)', padding: '24px' }}>
          {/* Paramètres */}
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 16 }}>
            <i className="fa-solid fa-gear me-2"></i>Paramètres
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="eth-form-label">Seuil d'alerte (stock)</label>
              <input
                type="number" min="1" className="form-control eth-input"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                placeholder="5"
              />
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
                Alerte envoyée quand le stock passe en dessous de ce seuil.
              </p>
            </div>
            <div>
              <label className="eth-form-label">E-mail de notification</label>
              <input
                type="email" className="form-control eth-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="support@ethnispirit.com"
              />
            </div>
            <div>
              <label className="eth-form-label">Alertes actives</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42 }}>
                <button
                  onClick={() => setIsActive(a => !a)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: isActive ? 'var(--tc-classic)' : '#CBD5E0',
                    position: 'relative', transition: 'background .2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 4,
                    left: isActive ? 23 : 4,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', transition: 'left .2s',
                  }} />
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                  {isActive ? 'Activées' : 'Désactivées'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-eth-primary"
              style={{ padding: '10px 24px' }}
            >
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 13, height: 13 }}></span>Enregistrement…</>
                : <><i className="fa-solid fa-floppy-disk me-2"></i>Enregistrer</>
              }
            </button>
            {saveOk && (
              <span style={{ fontSize: 13, color: 'var(--bio-main)', fontWeight: 600 }}>
                <i className="fa-solid fa-circle-check me-1"></i>Paramètres enregistrés
              </span>
            )}
          </div>

          {/* Demandes de réapprovisionnement clients */}
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 12 }}>
            <i className="fa-solid fa-envelope-open-text me-2"></i>Demandes clients ({notifications.length})
          </p>

          {notifications.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center', padding: '20px 0' }}>
              Aucune demande de réapprovisionnement pour le moment.
            </p>
          ) : (
            <div style={{ border: '1px solid var(--sand)', borderRadius: 10, overflow: 'hidden' }}>
              {/* En attente */}
              {lowStock.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', background: 'rgba(230,160,32,.08)', borderBottom: '1px solid var(--sand)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#C07800', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      En attente d'envoi ({lowStock.length})
                    </span>
                  </div>
                  {lowStock.map((n, i) => (
                    <div key={n.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px', fontSize: 13,
                      borderBottom: (i < lowStock.length - 1 || notified.length > 0) ? '1px solid var(--sand)' : 'none',
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{n.product_name}</span>
                        <span style={{ color: 'var(--text-light)', marginLeft: 8 }}>{n.email}</span>
                        {n.phone && <span style={{ color: 'var(--text-light)', marginLeft: 8 }}>· {n.phone}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                        {new Date(n.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {/* Notifiés */}
              {notified.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', background: 'rgba(45,90,46,.06)', borderBottom: notified.length > 0 ? '1px solid var(--sand)' : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bio-main)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      Déjà notifiés ({notified.length})
                    </span>
                  </div>
                  {notified.map((n, i) => (
                    <div key={n.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px', fontSize: 13, opacity: .6,
                      borderBottom: i < notified.length - 1 ? '1px solid var(--sand)' : 'none',
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{n.product_name}</span>
                        <span style={{ color: 'var(--text-light)', marginLeft: 8 }}>{n.email}</span>
                        {n.phone && <span style={{ color: 'var(--text-light)', marginLeft: 8 }}>· {n.phone}</span>}
                      </div>
                      <span style={{ fontSize: 11, background: 'rgba(45,90,46,.1)', color: 'var(--bio-main)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                        Notifié
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Valeurs par défaut du formulaire ─────────────────────────────────────────
const EMPTY = {
  name: '', category: '', subcategory: '', description: '', origin: '',
  price: '', old_price: '', stock: '0', certification: '',
  is_active: true, is_featured: false,
};

// ── Petits helpers ────────────────────────────────────────────────────────────
function Badge({ universe }) {
  const isBio = universe === 'bio';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isBio ? 'rgba(45,90,46,.12)' : 'rgba(198,93,59,.12)',
      color: isBio ? 'var(--bio-main)' : 'var(--tc-classic)',
    }}>{isBio ? 'Bio' : 'Mode'}</span>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--bio-main)' : '#CBD5E0',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
      }} />
    </button>
  );
}

// ── Modal Produit ─────────────────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSaved }) {
  const isEdit        = Boolean(product);
  const [form, setF]  = useState(isEdit ? {
    name:          product.name,
    category:      product.category_id || '',
    subcategory:   '',
    description:   product.description  || '',
    origin:        product.origin       || '',
    price:         product.price,
    old_price:     product.old_price    || '',
    stock:         product.stock,
    certification: product.certification || '',
    is_active:     product.is_active,
    is_featured:   product.is_featured,
  } : { ...EMPTY });

  const [existingImgs, setExistingImgs] = useState(isEdit ? (product.images || []) : []);
  const [newFiles,     setNewFiles]     = useState([]);
  const [previews,     setPreviews]     = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const fileRef = useRef();

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  function pickFiles(e) {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => setPreviews(prev => [...prev, ev.target.result]);
      r.readAsDataURL(f);
    });
    e.target.value = '';
  }

  function removeNew(i) {
    setNewFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function removeExisting(imgId) {
    try {
      await adminAPI.deleteImage(imgId);
      setExistingImgs(prev => prev.filter(img => img.id !== imgId));
    } catch { setError('Impossible de supprimer cette image.'); }
  }

  async function save() {
    if (!form.name.trim()) return setError('Le nom est requis.');
    if (!form.category)    return setError('La catégorie est requise.');
    if (!form.price)       return setError('Le prix est requis.');
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        // Les booléens doivent être des strings "true"/"false" pour multipart
        fd.append(k, typeof v === 'boolean' ? String(v) : v);
      });
      newFiles.forEach(f => fd.append('images', f));

      const saved = isEdit
        ? (await adminAPI.updateProduct(product.id, fd)).data
        : (await adminAPI.createProduct(fd)).data;

      onSaved(saved, isEdit);
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Une erreur est survenue. Veuillez réessayer.';
      if (data) {
        if (typeof data === 'string') {
          msg = 'Erreur serveur. Veuillez réessayer.';
        } else if (data.error) {
          msg = data.error;
        } else {
          // Convertit les erreurs de validation champ par champ en texte lisible
          const friendly = {
            name:          'Nom',
            price:         'Prix',
            old_price:     'Prix barré',
            stock:         'Stock',
            category:      'Catégorie',
            description:   'Description',
            certification: 'Certification',
          };
          const lines = Object.entries(data).map(([k, v]) => {
            const label = friendly[k] || k;
            const detail = Array.isArray(v) ? v.join(', ') : String(v);
            return `${label} : ${detail}`;
          });
          msg = lines.join('\n');
        }
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const selectedCat = categories.find(c => c.id === Number(form.category));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      zIndex: 1050, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--sand)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <h5 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 18 }}>
            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
          </h5>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-light)' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#B91C1C', fontSize: 13, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginTop: 2, flexShrink: 0 }}></i>
              <div>
                {error.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Nom */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="eth-form-label">Nom du produit *</label>
              <input className="form-control eth-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Robe Madras Traditionnelle" />
            </div>

            {/* Catégorie */}
            <div>
              <label className="eth-form-label">Catégorie *</label>
              <select className="form-select eth-input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">— Choisir —</option>
                {['mode', 'bio'].map(u => (
                  <optgroup key={u} label={u === 'mode' ? 'Mode Antillaise' : 'Bio & Naturel'}>
                    {categories.filter(c => c.universe === u).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Certification */}
            <div>
              <label className="eth-form-label">Certification / Label</label>
              <input className="form-control eth-input" value={form.certification} onChange={e => set('certification', e.target.value)} placeholder="Ex: Bio, Artisanal, Fait main…" />
            </div>

            {/* Prix */}
            <div>
              <label className="eth-form-label">Prix (€) *</label>
              <input type="number" min="0" step="0.01" className="form-control eth-input" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
            </div>

            {/* Ancien prix */}
            <div>
              <label className="eth-form-label">Prix barré (€) <span style={{ color: 'var(--text-light)', fontSize: 12 }}>optionnel</span></label>
              <input type="number" min="0" step="0.01" className="form-control eth-input" value={form.old_price} onChange={e => set('old_price', e.target.value)} placeholder="0.00" />
            </div>

            {/* Stock */}
            <div>
              <label className="eth-form-label">Stock</label>
              <input type="number" min="0" className="form-control eth-input" value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>

            {/* Origine */}
            <div>
              <label className="eth-form-label">Origine géographique</label>
              <input className="form-control eth-input" value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Ex: Côte d'Ivoire, Martinique…" />
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="eth-form-label">Description</label>
              <textarea className="form-control eth-input" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Décrivez ce produit…" style={{ resize: 'vertical' }} />
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 32, gridColumn: '1/-1', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <Toggle checked={form.is_active} onChange={() => set('is_active', !form.is_active)} />
                <span style={{ fontSize: 14, color: 'var(--text-dark)' }}>Produit actif (visible sur le site)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <Toggle checked={form.is_featured} onChange={() => set('is_featured', !form.is_featured)} />
                <span style={{ fontSize: 14, color: 'var(--text-dark)' }}>Mis en avant (page d'accueil)</span>
              </label>
            </div>

            {/* Images */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="eth-form-label">
                Images
                {selectedCat?.universe === 'bio'
                  ? <span style={{ color: 'var(--bio-main)', marginLeft: 6, fontSize: 12 }}>Bio</span>
                  : selectedCat && <span style={{ color: 'var(--tc-classic)', marginLeft: 6, fontSize: 12 }}>Mode</span>}
              </label>

              {/* Images existantes */}
              {existingImgs.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {existingImgs.map((img, i) => (
                    <div key={img.id} style={{ position: 'relative' }}>
                      <img src={img.image} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: img.is_main ? '2px solid var(--tc-classic)' : '1px solid var(--sand)' }} />
                      {img.is_main && (
                        <span style={{ position: 'absolute', bottom: 2, left: 2, background: 'var(--tc-classic)', color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 4, fontWeight: 700 }}>MAIN</span>
                      )}
                      <button onClick={() => removeExisting(img.id)} style={{
                        position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                        borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff',
                        fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Nouvelles images */}
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px dashed var(--tc-classic)', opacity: .85 }} />
                      <button onClick={() => removeNew(i)} style={{
                        position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                        borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff',
                        fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileRef.current.click()}
                style={{
                  border: '2px dashed var(--sand)', background: 'var(--cream)',
                  borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
                  color: 'var(--text-mid)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'border-color .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--tc-classic)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--sand)'}
              >
                <i className="fa-solid fa-cloud-arrow-up"></i>
                Ajouter des images
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={pickFiles} />
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
                La première image sera l'image principale. Formats JPG, PNG, WebP.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--sand)',
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
          background: '#fafaf9',
        }}>
          <button onClick={onClose} className="btn-eth-outline" style={{ padding: '10px 22px' }}>
            Annuler
          </button>
          <button onClick={save} disabled={saving} className="btn-eth-primary" style={{ padding: '10px 28px', minWidth: 120 }}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }}></span>Enregistrement…</> : (isEdit ? 'Enregistrer' : 'Créer le produit')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale de confirmation de suppression ──────────────────────────────────────
function DeleteConfirm({ item, label, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    await onConfirm();
    setBusy(false);
  }
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 12px 40px rgba(0,0,0,.2)', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <i className="fa-solid fa-trash" style={{ color: '#EF4444', fontSize: 20 }}></i>
        </div>
        <h6 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, marginBottom: 8 }}>Supprimer ce produit ?</h6>
        <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20 }}>
          <strong>{label}</strong> sera définitivement supprimé. Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn-eth-outline" style={{ padding: '9px 22px' }}>Annuler</button>
          <button onClick={go} disabled={busy} style={{
            padding: '9px 22px', borderRadius: 8, background: '#EF4444', color: '#fff',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            {busy ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState(null); // null | { product: null|{} }
  const [deleting,    setDeleting]    = useState(null); // product to delete

  useEffect(() => {
    Promise.all([adminAPI.products(), categoriesAPI.list()])
      .then(([prods, cats]) => {
        setProducts(prods.data);
        setCategories(cats.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSaved(saved, isEdit) {
    setProducts(prev =>
      isEdit ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
    );
    setModal(null);
  }

  async function handleDelete(product) {
    await adminAPI.deleteProduct(product.id);
    setProducts(prev => prev.filter(p => p.id !== product.id));
    setDeleting(null);
  }

  async function toggleActive(product) {
    const fd = new FormData();
    fd.append('is_active', String(!product.is_active));
    try {
      const { data } = await adminAPI.updateProduct(product.id, fd);
      setProducts(prev => prev.map(p => p.id === data.id ? data : p));
    } catch { /* silent */ }
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <MobileBackButton to="/admin-dashboard" label="Dashboard" />
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="eth-section-label">Administration</p>
            <h1 className="eth-section-title">Gestion des <em>produits</em></h1>
          </div>
          <button onClick={() => setModal({ product: null })} className="btn-eth-primary" style={{ padding: '11px 24px' }}>
            <i className="fa-solid fa-plus me-2"></i>Nouveau produit
          </button>
        </div>
      </div>

      <div className="eth-page-body">
        {/* Barre de recherche */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: 13, pointerEvents: 'none' }}></i>
            <input
              type="search"
              className="form-control eth-input"
              style={{ paddingLeft: 38 }}
              placeholder="Rechercher un produit…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border eth-spinner"></div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--sand)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="table-responsive">
              <table className="table eth-admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 64 }}>Image</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Actif</th>
                    <th>Univers</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        {p.main_image ? (
                          <img src={p.main_image} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-image" style={{ color: 'var(--text-light)' }}></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-dark)', fontSize: 14 }}>{p.name}</strong>
                        {p.is_featured && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(230,160,32,.15)', color: '#B37B00', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>★ VEDETTE</span>}
                      </td>
                      <td><span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{p.category_name || '—'}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--tc-classic)', fontSize: 14 }}>{formatPrice(p.price)}</span>
                        {p.old_price && <div style={{ fontSize: 11, color: 'var(--text-light)', textDecoration: 'line-through' }}>{formatPrice(p.old_price)}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 600, color: p.stock > 0 ? 'var(--bio-main)' : '#C0392B' }}>
                          {p.stock > 0 ? p.stock : 'Rupture'}
                        </span>
                      </td>
                      <td>
                        <Toggle checked={p.is_active} onChange={() => toggleActive(p)} />
                      </td>
                      <td><Badge universe={p.universe} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setModal({ product: p })}
                            className="btn-eth-outline"
                            style={{ padding: '6px 12px', fontSize: 13 }}
                            title="Modifier"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            onClick={() => setDeleting(p)}
                            style={{ padding: '6px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', color: '#EF4444', cursor: 'pointer' }}
                            title="Supprimer"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px', fontSize: 14 }}>
                  Aucun produit trouvé.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Alertes stock & réapprovisionnement */}
        <StockAlertsPanel />
      </div>

      {/* Modales */}
      {modal !== null && (
        <ProductModal
          product={modal.product}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <DeleteConfirm
          item={deleting}
          label={deleting.name}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
