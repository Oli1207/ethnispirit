import { Link } from 'react-router-dom';
import { useState } from 'react';
import { newsletterAPI } from '../utils/api';

export default function BioFooter() {
  const [email, setEmail] = useState('');
  const [msg, setMsg]     = useState('');
  const [sent, setSent]   = useState(false);

  function handleNewsletter(e) {
    e.preventDefault();
    newsletterAPI.subscribe(email, 'bio')
      .then(({ data }) => { setMsg(data.message || 'Merci pour votre inscription !'); setSent(true); })
      .catch(() => setMsg('Une erreur est survenue.'));
  }

  return (
    <footer className="bio-footer">
      <div className="bio-footer-inner">
        {/* Col 1 — Marque */}
        <div className="bio-footer-col">
          <div className="bio-footer-logo">
            <i className="fa-solid fa-leaf"></i>
            EthniSpirit <em>Bio</em>
          </div>
          <p className="bio-footer-tagline">
            Soins naturels, huiles essentielles<br />et produits bio des Caraïbes.
          </p>
          <div className="bio-footer-socials">
            <a href="#" className="bio-social-btn" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" className="bio-social-btn" aria-label="Facebook">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a href="#" className="bio-social-btn" aria-label="Pinterest">
              <i className="fa-brands fa-pinterest-p"></i>
            </a>
          </div>
          <div className="bio-footer-certifs">
            <span className="bio-certif-badge">
              <i className="fa-solid fa-certificate me-1"></i>Bio
            </span>
            <span className="bio-certif-badge">
              <i className="fa-solid fa-leaf me-1"></i>Naturel
            </span>
            <span className="bio-certif-badge">
              <i className="fa-solid fa-handshake me-1"></i>Équitable
            </span>
          </div>
        </div>

        {/* Col 2 — Navigation */}
        <div className="bio-footer-col">
          <h6 className="bio-footer-heading">Navigation</h6>
          <ul className="bio-footer-links">
            <li><Link to="/bio">Accueil Bio</Link></li>
            <li><Link to="/bio/catalogue">Produits Bio</Link></li>
            <li>
              <Link to="/" className="bio-footer-mode-link">
                <i className="fa-solid fa-shirt me-1"></i>Mode Caribéenne
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3 — Aide */}
        <div className="bio-footer-col">
          <h6 className="bio-footer-heading">Aide &amp; Info</h6>
          <ul className="bio-footer-links">
            <li><Link to="/livraison">Livraison</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/politique">Politique de confidentialité</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Col 4 — Newsletter */}
        <div className="bio-footer-col">
          <h6 className="bio-footer-heading">Newsletter Bio</h6>
          <p className="bio-footer-tagline" style={{ fontSize: '13px' }}>
            Recevez nos conseils bien-être et nouveautés.
          </p>
          {sent ? (
            <p className="bio-footer-success">
              <i className="fa-solid fa-circle-check me-2"></i>
              {msg}
            </p>
          ) : (
            <form onSubmit={handleNewsletter} className="bio-footer-newsletter">
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
              {msg && <p className="mt-1 small" style={{ color: 'var(--bio-light)' }}>{msg}</p>}
            </form>
          )}
        </div>
      </div>

      <div className="bio-footer-bottom">
        <p>&copy; {new Date().getFullYear()} EthniSpirit Bio — Tous droits réservés</p>
        <div className="bio-footer-bottom-links">
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
