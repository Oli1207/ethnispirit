import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';

export default function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token') || '';
  const [form, setForm]       = useState({ new_password: '', new_password2: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.new_password !== form.new_password2) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    authAPI.resetPassword({ token, new_password: form.new_password })
      .then(() => navigate('/login', { state: { reset: true } }))
      .catch((err) => {
        setError(err.response?.data?.error || 'Lien invalide ou expiré. Veuillez recommencer.');
        setLoading(false);
      });
  }

  return (
    <div className="eth-auth-page">
      {/* ── Left branding panel ──────────────────────────────────────── */}
      <div className="eth-auth-left">
        <div className="eth-auth-left-inner">
          <div className="eth-auth-brand">
            <span className="eth-auth-brand-name">Ethni<em>Spirit</em></span>
          </div>
          <h2 className="eth-auth-left-title">
            Nouveau<br /><em>mot de passe</em>
          </h2>
          <p className="eth-auth-left-sub">
            Choisissez un mot de passe fort pour sécuriser votre compte EthniSpirit.
          </p>
          <div className="eth-auth-left-features">
            {[
              { icon: 'fa-lock',          text: 'Minimum 8 caractères' },
              { icon: 'fa-font',          text: 'Mélangez lettres et chiffres' },
              { icon: 'fa-shield-halved', text: 'Ne réutilisez pas un ancien mot de passe' },
            ].map((f) => (
              <div className="eth-auth-feature" key={f.icon}>
                <i className={`fa-solid ${f.icon}`}></i>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="eth-auth-right">
        <div className="eth-auth-form-wrap">
          <div className="eth-auth-form-header">
            <h2 className="eth-auth-title">Nouveau mot de passe</h2>
            <p className="eth-auth-sub">Saisissez et confirmez votre nouveau mot de passe.</p>
          </div>

          {error && (
            <div className="eth-inline-error mb-4">
              <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
            </div>
          )}

          {!token && (
            <div className="eth-inline-error mb-4">
              <i className="fa-solid fa-triangle-exclamation me-2"></i>
              Lien invalide. Veuillez recommencer la procédure de réinitialisation.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="eth-label">Nouveau mot de passe</label>
              <input
                type="password"
                className="form-control eth-input"
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                required
                disabled={!token}
                placeholder="••••••••"
              />
            </div>
            <div className="mb-4">
              <label className="eth-label">Confirmer le mot de passe</label>
              <input
                type="password"
                className="form-control eth-input"
                value={form.new_password2}
                onChange={(e) => setForm({ ...form, new_password2: e.target.value })}
                required
                disabled={!token}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="btn-eth-primary w-100"
              style={{ padding: '13px' }}
              disabled={loading || !token}
            >
              {loading
                ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="fa-solid fa-key me-2"></i>
              }
              Réinitialiser le mot de passe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
