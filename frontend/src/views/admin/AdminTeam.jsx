import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import {
  ROLE_LABELS,
  PERMISSION_LABELS,
  ALL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
} from '../../utils/permissions';

const UNIVERSE_OPTIONS = [
  { value: 'mode', label: 'Mode Caribéenne' },
  { value: 'bio',  label: 'Bio & Naturel' },
];

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

const EMPTY_FORM = {
  email:             '',
  full_name:         '',
  password:          '',
  role:              'support',
  extra_permissions: {},
  notify_universes:  [],
};

export default function AdminTeam() {
  const [staff,       setStaff]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null); // null = create
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  // Permissions de base du rôle sélectionné (pour affichage de référence)
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[form.role] || {};

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const { data } = await adminAPI.staffList();
      setStaff(data);
    } catch {
      setError('Impossible de charger l\'équipe.');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function openEdit(member) {
    setEditTarget(member);
    setForm({
      email:             member.email,
      full_name:         member.full_name,
      password:          '',
      role:              member.role,
      extra_permissions: member.extra_permissions || {},
      notify_universes:  member.notify_universes  || [],
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function togglePermission(perm) {
    setForm((f) => {
      const current = f.extra_permissions[perm];
      // Si la perm est dans les defaults du rôle, la surcharge avec false la supprime
      // Si elle est ajoutée (true) sans être dans les defaults, la retirer
      const next = { ...f.extra_permissions };
      if (current === undefined) {
        // pas de surcharge — activer si le rôle ne l'a pas déjà, désactiver si il l'a
        next[perm] = !roleDefaults[perm];
      } else {
        delete next[perm]; // retirer la surcharge → revenir au défaut du rôle
      }
      return { ...f, extra_permissions: next };
    });
  }

  function toggleUniverse(u) {
    setForm((f) => {
      const list = f.notify_universes || [];
      return {
        ...f,
        notify_universes: list.includes(u) ? list.filter((x) => x !== u) : [...list, u],
      };
    });
  }

  // Compute effective permissions for preview
  function getEffective(role, extra) {
    const base = { ...(ROLE_DEFAULT_PERMISSIONS[role] || {}) };
    Object.entries(extra).forEach(([k, v]) => {
      if (v === false) delete base[k];
      else base[k] = true;
    });
    return base;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editTarget) {
        const payload = {
          role:              form.role,
          extra_permissions: form.extra_permissions,
          notify_universes:  form.notify_universes,
        };
        if (form.password) payload.password = form.password;
        await adminAPI.staffUpdate(editTarget.id, payload);
        setSuccess('Membre mis à jour.');
      } else {
        await adminAPI.staffCreate({
          email:             form.email,
          full_name:         form.full_name,
          password:          form.password,
          role:              form.role,
          extra_permissions: form.extra_permissions,
          notify_universes:  form.notify_universes,
        });
        setSuccess('Compte créé. Un email de bienvenue a été envoyé.');
      }
      await fetchStaff();
      setTimeout(() => setShowModal(false), 1200);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data || 'Une erreur est survenue.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(member) {
    try {
      await adminAPI.staffUpdate(member.id, { is_active: !member.is_active });
      await fetchStaff();
    } catch {
      alert('Erreur lors de la mise à jour.');
    }
  }

  const effective = getEffective(form.role, form.extra_permissions);

  return (
    <div className="eth-admin-section">
      {/* Header */}
      <div className="eth-admin-section-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h2 className="eth-admin-section-title mb-1">
            <i className="fa-solid fa-users me-2"></i>Équipe & Accès
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: 14 }}>
            Gérez les comptes de gestion et leurs permissions.
          </p>
        </div>
        <button className="eth-admin-btn" onClick={openCreate}>
          <i className="fa-solid fa-plus me-2"></i>Ajouter un membre
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border eth-spinner" role="status" />
        </div>
      ) : staff.length === 0 ? (
        <div className="eth-admin-empty">
          <i className="fa-solid fa-users-slash fa-2x mb-3 text-muted"></i>
          <p>Aucun membre dans l'équipe pour l'instant.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table eth-admin-table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Rôle</th>
                <th>Notifications</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((m) => (
                <tr key={m.id} style={{ opacity: m.is_active ? 1 : 0.5 }}>
                  <td>
                    <div className="fw-semibold">{m.full_name || '—'}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>{m.email}</div>
                  </td>
                  <td>
                    <span className={`eth-badge eth-badge-role eth-badge-${m.role}`}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {m.notify_universes && m.notify_universes.length > 0
                      ? m.notify_universes.map((u) => (
                          <span key={u} className="eth-badge eth-badge-sm me-1">
                            {u === 'mode' ? '👗 Mode' : '🌿 Bio'}
                          </span>
                        ))
                      : <span className="text-muted">Tous</span>
                    }
                  </td>
                  <td>
                    <span className={`eth-badge ${m.is_active ? 'eth-badge-success' : 'eth-badge-danger'}`}>
                      {m.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="eth-admin-btn eth-admin-btn-sm eth-admin-btn-outline"
                        onClick={() => openEdit(m)}
                        title="Modifier"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        className={`eth-admin-btn eth-admin-btn-sm ${m.is_active ? 'eth-admin-btn-danger' : 'eth-admin-btn-outline'}`}
                        onClick={() => handleToggleActive(m)}
                        title={m.is_active ? 'Désactiver' : 'Réactiver'}
                      >
                        <i className={`fa-solid fa-${m.is_active ? 'ban' : 'check'}`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="eth-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="eth-modal eth-modal-lg">
            <div className="eth-modal-header">
              <h5>{editTarget ? 'Modifier le membre' : 'Ajouter un membre'}</h5>
              <button className="eth-modal-close" onClick={() => setShowModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="eth-modal-body">
              {error   && <div className="eth-alert eth-alert-danger mb-3">{error}</div>}
              {success && <div className="eth-alert eth-alert-success mb-3">{success}</div>}

              {/* Infos de base (uniquement à la création) */}
              {!editTarget && (
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="eth-admin-label">Nom complet</label>
                    <input
                      type="text"
                      className="eth-admin-input"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Prénom Nom"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="eth-admin-label">Email *</label>
                    <input
                      type="email"
                      className="eth-admin-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>
              )}

              {/* Mot de passe */}
              <div className="mb-3">
                <label className="eth-admin-label">
                  {editTarget ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                </label>
                <input
                  type="password"
                  className="eth-admin-input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editTarget}
                  placeholder={editTarget ? 'Laisser vide pour conserver' : '8 caractères minimum'}
                />
              </div>

              {/* Rôle */}
              <div className="mb-3">
                <label className="eth-admin-label">Rôle</label>
                <select
                  className="eth-admin-input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value, extra_permissions: {} })}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Permissions */}
              <div className="mb-3">
                <label className="eth-admin-label">
                  Permissions
                  <span className="text-muted ms-2" style={{ fontSize: 12, fontWeight: 400 }}>
                    Coché = actif. Les cases en gris = par défaut du rôle.
                  </span>
                </label>
                <div className="eth-perm-grid">
                  {ALL_PERMISSIONS.map((perm) => {
                    const inRole    = Boolean(roleDefaults[perm]);
                    const override  = form.extra_permissions[perm];
                    const isActive  = override !== undefined ? override : inRole;
                    const isCustom  = override !== undefined;
                    return (
                      <label
                        key={perm}
                        className={`eth-perm-chip ${isActive ? 'active' : ''} ${isCustom ? 'overridden' : ''}`}
                        title={isCustom ? 'Permission personnalisée (clic pour annuler)' : (inRole ? 'Permission du rôle (clic pour désactiver)' : 'Non incluse dans ce rôle (clic pour activer)')}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => togglePermission(perm)}
                          className="visually-hidden"
                        />
                        <i className={`fa-solid fa-${isActive ? 'check' : 'xmark'} me-1`} style={{ fontSize: 10 }}></i>
                        {PERMISSION_LABELS[perm] || perm}
                        {isCustom && <span className="eth-perm-dot"></span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notifications */}
              <div className="mb-4">
                <label className="eth-admin-label">
                  Notifications push
                  <span className="text-muted ms-2" style={{ fontSize: 12, fontWeight: 400 }}>
                    Laisser vide = tous les univers
                  </span>
                </label>
                <div className="d-flex gap-3">
                  {UNIVERSE_OPTIONS.map((u) => (
                    <label key={u.value} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(form.notify_universes || []).includes(u.value)}
                        onChange={() => toggleUniverse(u.value)}
                      />
                      {u.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview permissions effectives */}
              <div className="eth-perm-preview">
                <p className="mb-1" style={{ fontSize: 12, color: 'var(--tc-classic)', fontWeight: 600 }}>
                  <i className="fa-solid fa-eye me-1"></i>Permissions effectives :
                </p>
                <div className="d-flex flex-wrap gap-1">
                  {Object.keys(effective).length === 0 ? (
                    <span className="text-muted" style={{ fontSize: 12 }}>Aucune</span>
                  ) : Object.keys(effective).map((p) => (
                    <span key={p} className="eth-badge eth-badge-sm eth-badge-perm">
                      {PERMISSION_LABELS[p] || p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="eth-modal-footer mt-4">
                <button type="button" className="eth-admin-btn eth-admin-btn-outline" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="eth-admin-btn" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  {editTarget ? 'Enregistrer' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
