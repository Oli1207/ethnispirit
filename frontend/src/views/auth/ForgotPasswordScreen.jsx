import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    authAPI.forgotPassword({ email })
      .then(() => setSent(true))
      .catch(() => setSent(true)) // réponse neutre côté serveur
      .finally(() => setLoading(false));
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
            Réinitialisation<br />du <em>mot de passe</em>
          </h2>
          <p className="eth-auth-left-sub">
            Saisissez votre email et nous vous enverrons un lien sécurisé pour définir un nouveau mot de passe.
          </p>
          <div className="eth-auth-left-features">
            {[
              { icon: 'fa-envelope',      text: 'Lien envoyé en quelques secondes' },
              { icon: 'fa-clock',         text: 'Valable 24 heures' },
              { icon: 'fa-shield-halved', text: 'Lien à usage unique sécurisé' },
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
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div className="eth-confirm-icon-wrap eth-confirm-icon-success" style={{ margin: '0 auto 24px' }}>
                <i className="fa-solid fa-envelope-circle-check"></i>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: 'var(--text-dark)', marginBottom: 12 }}>
                Email envoyé
              </h3>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Si un compte existe pour <strong>{email}</strong>, vous recevrez un email de réinitialisation dans quelques instants. Vérifiez également vos spams.
              </p>
              <Link to="/login" className="btn-eth-primary" style={{ padding: '12px 28px' }}>
                <i className="fa-solid fa-arrow-left me-2"></i>Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="eth-auth-form-header">
                <h2 className="eth-auth-title">Mot de passe oublié</h2>
                <p className="eth-auth-sub">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="eth-label">Adresse email</label>
                  <input
                    type="email"
                    className="form-control eth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="marie@email.fr"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-eth-primary w-100"
                  style={{ padding: '13px' }}
                  disabled={loading}
                >
                  {loading
                    ? <span className="spinner-border spinner-border-sm me-2"></span>
                    : <i className="fa-solid fa-paper-plane me-2"></i>
                  }
                  Envoyer le lien
                </button>
              </form>

              <div className="eth-auth-divider"><span>ou</span></div>

              <p className="eth-auth-switch">
                <Link to="/login" className="eth-auth-link">
                  <i className="fa-solid fa-arrow-left me-1"></i>Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
