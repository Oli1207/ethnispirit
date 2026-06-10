import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';

export default function RegisterScreen() {
  const [form, setForm]     = useState({ email: '', full_name: '', password: '', password2: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await authAPI.register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setErrors(err.response?.data || {});
      setLoading(false);
    }
  }

  function inputField(name, label, type = 'text', placeholder = '') {
    return (
      <div className="mb-3">
        <label className="eth-label">{label}</label>
        <input
          type={type}
          className={`form-control eth-input ${errors[name] ? 'is-invalid' : ''}`}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          required
          placeholder={placeholder}
        />
        {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
      </div>
    );
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
            Rejoignez la communauté<br /><em>EthniSpirit</em>
          </h2>
          <p className="eth-auth-left-sub">
            Créez votre compte et découvrez notre sélection d'artisanat africain livré aux Caraïbes.
          </p>
          <div className="eth-auth-left-features">
            {[
              { icon: 'fa-bag-shopping',  text: 'Suivi de commandes en temps réel' },
              { icon: 'fa-heart',         text: 'Liste de favoris personnalisée' },
              { icon: 'fa-tag',           text: 'Offres exclusives membres' },
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
            <h2 className="eth-auth-title">Créer un compte</h2>
            <p className="eth-auth-sub">Remplissez les informations ci-dessous.</p>
          </div>

          {errors.non_field_errors && (
            <div className="eth-inline-error mb-4">
              <i className="fa-solid fa-circle-exclamation me-2"></i>
              {errors.non_field_errors}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {inputField('full_name', 'Nom complet', 'text', 'Marie Dupont')}
            {inputField('email', 'Adresse email', 'email', 'marie@email.fr')}
            {inputField('password', 'Mot de passe', 'password', '••••••••')}
            {inputField('password2', 'Confirmer le mot de passe', 'password', '••••••••')}

            <button
              type="submit"
              className="btn-eth-primary w-100"
              style={{ padding: '13px', marginTop: 8 }}
              disabled={loading}
            >
              {loading
                ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="fa-solid fa-user-plus me-2"></i>
              }
              Créer mon compte
            </button>
          </form>

          <div className="eth-auth-divider">
            <span>ou</span>
          </div>

          <p className="eth-auth-switch">
            Déjà un compte ?{' '}
            <Link to="/login" className="eth-auth-link">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
