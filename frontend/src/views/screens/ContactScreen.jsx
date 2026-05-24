import { useState } from 'react';
import { contactAPI } from '../../utils/api';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';

export default function ContactScreen() {
  const [form, setForm]     = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await contactAPI.send(form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--cream)' }}>
      <SEO
        title="Nous contacter"
        description="Une question sur votre commande, un produit ou une livraison ? Contactez l'équipe EthniSpirit. Réponse sous 24h."
      />
      <MobileBackButton to="/" label="Accueil" />
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="eth-page-header">
        <div className="eth-page-header-inner">
          <div>
            <p className="eth-section-label">Assistance</p>
            <h1 className="eth-section-title">Contactez-<em>nous</em></h1>
            <p className="eth-section-sub mt-1">Nous répondons sous 24 h ouvrées.</p>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="eth-page-body">
        <div className="eth-contact-layout">

          {/* Coordonnées */}
          <div className="eth-contact-info">
            {[
              {
                icon: 'fa-envelope',
                title: 'Email',
                detail: 'support@ethnispirit.com',
                sub: 'Réponse sous 24 h ouvrées',
              },
              {
                icon: 'fa-brands fa-instagram',
                title: 'Instagram',
                detail: '@ethnispirit',
                sub: 'Suivez nos actualités',
              },
              {
                icon: 'fa-location-dot',
                title: 'Zone de livraison',
                detail: 'Martinique & Guadeloupe',
                sub: 'Délai 5 – 8 jours ouvrés',
              },
              {
                icon: 'fa-clock',
                title: 'Horaires',
                detail: 'Lun – Ven, 9h – 18h',
                sub: 'Heure de Martinique (GMT-4)',
              },
            ].map((item) => (
              <div className="eth-contact-item" key={item.icon}>
                <div className="eth-contact-icon-wrap">
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <div className="eth-contact-item-text">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  {item.sub && <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{item.sub}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire */}
          <div className="eth-contact-form-box">
            {sent ? (
              <div className="eth-success-box">
                <div className="eth-success-box-icon">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <h5>Message envoyé</h5>
                <p>Merci, nous vous répondrons dans les meilleurs délais à l'adresse <strong>{form.email}</strong>.</p>
              </div>
            ) : (
              <>
                <h5 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: 'var(--text-dark)', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--sand)' }}>
                  Envoyer un message
                </h5>
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="eth-label">Nom complet</label>
                      <input
                        className="form-control eth-input"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="Marie Dupont"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="eth-label">Email</label>
                      <input
                        type="email"
                        className="form-control eth-input"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        placeholder="marie@email.fr"
                      />
                    </div>
                    <div className="col-12">
                      <label className="eth-label">Sujet</label>
                      <select
                        className="form-select eth-input"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        required
                      >
                        <option value="">Sélectionner un sujet</option>
                        <option>Suivi de commande</option>
                        <option>Retour / Échange</option>
                        <option>Question produit</option>
                        <option>Paiement</option>
                        <option>Autre</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="eth-label">Message</label>
                      <textarea
                        className="form-control eth-input"
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        placeholder="Décrivez votre demande..."
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="eth-inline-error mt-3">
                      <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
                    </div>
                  )}

                  <button type="submit" className="btn-eth-primary mt-4" style={{ padding: '13px 28px' }} disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Envoi en cours…</>
                    ) : (
                      <><i className="fa-solid fa-paper-plane me-2"></i>Envoyer le message</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
