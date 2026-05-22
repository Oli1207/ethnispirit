import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/auth';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

export default function LoginScreen() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const justRegistered = location.state?.registered;
  const justReset      = location.state?.reset;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="eth-auth-page">
      <SEO title="Connexion" description="Connectez-vous à votre espace EthniSpirit pour suivre vos commandes." noindex={true} />
      <MobileBackButton to="/" label="Accueil" />
      {/* ── Left branding panel ──────────────────────────────────────── */}
      <div className="eth-auth-left">
        <div className="eth-auth-left-inner">
          <div className="eth-auth-brand">
            <span className="eth-auth-brand-name">Ethni<em>Spirit</em></span>
          </div>
          <h2 className="eth-auth-left-title">
            L'artisanat ivoirien<br />au cœur des <em>Caraïbes</em>
          </h2>
          <p className="eth-auth-left-sub">
            Bijoux, vêtements et accessoires — des pièces authentiques livrées en Martinique et Guadeloupe.
          </p>
          <div className="eth-auth-left-features">
            {[
              { icon: 'fa-shield-halved',  text: 'Paiement sécurisé Stripe' },
              { icon: 'fa-truck-fast',     text: 'Livraison 5–8 jours ouvrés' },
              { icon: 'fa-gem',            text: 'Artisanat 100 % authentique' },
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
            <h2 className="eth-auth-title">Connexion</h2>
            <p className="eth-auth-sub">Bienvenue, saisissez vos identifiants.</p>
          </div>

          {justRegistered && (
            <div className="eth-inline-success mb-4">
              <i className="fa-solid fa-circle-check me-2"></i>
              Compte créé avec succès. Vous pouvez vous connecter.
            </div>
          )}
          {justReset && (
            <div className="eth-inline-success mb-4">
              <i className="fa-solid fa-circle-check me-2"></i>
              Mot de passe réinitialisé. Connectez-vous avec votre nouveau mot de passe.
            </div>
          )}
          {error && (
            <div className="eth-inline-error mb-4">
              <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="eth-label">Adresse email</label>
              <input
                type="email"
                className="form-control eth-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
                placeholder="marie@email.fr"
              />
            </div>
            <div className="mb-2">
              <label className="eth-label">Mot de passe</label>
              <input
                type="password"
                className="form-control eth-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <Link to="/mot-de-passe-oublie" className="eth-auth-link-small">
                Mot de passe oublié ?
              </Link>
            </div>
            <button type="submit" className="btn-eth-primary w-100" style={{ padding: '13px' }} disabled={loading}>
              {loading
                ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="fa-solid fa-right-to-bracket me-2"></i>
              }
              Se connecter
            </button>
          </form>

          <div className="eth-auth-divider">
            <span>ou</span>
          </div>

          <p className="eth-auth-switch">
            Pas encore de compte ?{' '}
            <Link to="/register" className="eth-auth-link">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
