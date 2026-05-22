import { Link } from 'react-router-dom';
import { useState } from 'react';
import { newsletterAPI } from '../utils/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [msg, setMsg]     = useState('');
  const [sent, setSent]   = useState(false);

  function handleNewsletter(e) {
    e.preventDefault();
    newsletterAPI.subscribe(email, 'mode')
      .then(({ data }) => { setMsg(data.message || 'Merci pour votre inscription !'); setSent(true); })
      .catch(() => setMsg('Une erreur est survenue.'));
  }

  return (
    <footer className="eth-footer">
      <div className="eth-footer-inner">
        {/* Col 1 — Marque */}
        <div className="eth-footer-col">
          <div className="eth-footer-logo">
            Ethni<em>Spirit</em>
          </div>
          <p className="eth-footer-tagline">
            Mode et artisanat ivoirien,<br />au cœur des Caraïbes.
          </p>
          <div className="eth-footer-socials">
            <a href="#" className="eth-social-btn" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" className="eth-social-btn" aria-label="Facebook">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a href="#" className="eth-social-btn" aria-label="TikTok">
              <i className="fa-brands fa-tiktok"></i>
            </a>
            <a href="#" className="eth-social-btn" aria-label="Pinterest">
              <i className="fa-brands fa-pinterest-p"></i>
            </a>
          </div>
        </div>

        {/* Col 2 — Navigation */}
        <div className="eth-footer-col">
          <h6 className="eth-footer-heading">Navigation</h6>
          <ul className="eth-footer-links">
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/catalogue">Catalogue</Link></li>
            <li><Link to="/a-propos">À propos</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Col 3 — Aide */}
        <div className="eth-footer-col">
          <h6 className="eth-footer-heading">Aide &amp; Info</h6>
          <ul className="eth-footer-links">
            <li><Link to="/livraison">Livraison</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/politique">Politique de confidentialité</Link></li>
            <li>
              <Link to="/bio" className="eth-footer-bio-link">
                <i className="fa-solid fa-leaf me-1"></i>
                Bio &amp; Naturel
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4 — Newsletter */}
        <div className="eth-footer-col">
          <h6 className="eth-footer-heading">Newsletter</h6>
          <p className="eth-footer-tagline small" style={{ fontSize: '13px' }}>
            Nouvelles collections et offres exclusives.
          </p>
          {sent ? (
            <p className="eth-footer-success">
              <i className="fa-solid fa-circle-check me-2"></i>
              {msg}
            </p>
          ) : (
            <form onSubmit={handleNewsletter} className="eth-footer-newsletter">
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" aria-label="S'inscrire">
                <i className="fa-solid fa-paper-plane"></i>
              </button>
              {msg && <p className="mt-1 small" style={{ color: 'var(--tc-light)' }}>{msg}</p>}
            </form>
          )}
          <div className="eth-footer-pay">
            <span className="eth-pay-badge">
              <i className="fa-brands fa-stripe me-1"></i>Stripe
            </span>
            <span className="eth-pay-badge">
              <i className="fa-solid fa-shield-halved me-1"></i>Sécurisé
            </span>
          </div>
        </div>
      </div>

      <div className="eth-footer-bottom">
        <p>&copy; {new Date().getFullYear()} EthniSpirit — Tous droits réservés</p>
        <div className="eth-footer-bottom-links">
          <Link to="/politique">Confidentialité</Link>
          <span className="sep">·</span>
          <Link to="/livraison">Livraison</Link>
          <span className="sep">·</span>
          <Link to="/faq">FAQ</Link>
        </div>
      </div>
    </footer>
  );
}
