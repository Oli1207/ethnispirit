import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import useCartStore from '../store/cart';
import logoBio from '../assets/logo_ethnispirit_bio.png';
import useFavicon from '../hooks/useFavicon';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const cart = useCartStore((s) => s.cart);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  useFavicon('mode');

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="eth-top-bar">
        <div className="eth-top-bar-item">
          <i className="fa-solid fa-truck-fast"></i>
          Livraison Martinique &amp; Guadeloupe
        </div>
        <span className="sep">|</span>
        <div className="eth-top-bar-item">
          <i className="fa-solid fa-shield-halved"></i>
          Paiement sécurisé Stripe
        </div>
        <span className="sep">|</span>
        <div className="eth-top-bar-item">
          <i className="fa-solid fa-gem"></i>
          Artisanat authentique ivoirien
        </div>
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="eth-navbar">
        {/* Logo */}
        <Link className="eth-nav-logo" to="/">
          <img
            src={logoBio}
            alt="EthniSpirit"
            className="eth-nav-logo-img"
          />
        </Link>

        {/* Nav links — centre */}
        <ul className="eth-nav-links d-none d-lg-flex">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
              Accueil
            </NavLink>
          </li>
          <li>
            <NavLink to="/catalogue" className={({ isActive }) => isActive ? 'active' : ''}>
              Catalogue
            </NavLink>
          </li>
          <li>
            <NavLink to="/a-propos" className={({ isActive }) => isActive ? 'active' : ''}>
              À propos
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''}>
              Contact
            </NavLink>
          </li>
          <li className="eth-bio-nav-pill">
            <Link to="/bio">
              <i className="fa-solid fa-leaf"></i>
              Bio &amp; Naturel
            </Link>
          </li>
        </ul>

        {/* Actions droite */}
        <div className="eth-nav-actions d-none d-lg-flex">
          {/* Panier */}
          <Link className="eth-icon-btn-nav" to="/panier" title="Panier">
            <i className="fa-solid fa-bag-shopping"></i>
            {itemCount > 0 && <span className="eth-cart-badge">{itemCount}</span>}
          </Link>

          {isAuthenticated ? (
            <>
              <Link className="eth-icon-btn-nav" to="/favoris" title="Favoris">
                <i className="fa-regular fa-heart"></i>
              </Link>
              <Link className="eth-icon-btn-nav" to="/compte" title="Mon compte">
                <i className="fa-solid fa-user"></i>
              </Link>
              {(user?.is_staff || user?.is_superuser) && (
                <Link className="eth-icon-btn-nav" to="/admin-dashboard" title="Administration">
                  <i className="fa-solid fa-gauge"></i>
                </Link>
              )}
              <button className="eth-nav-btn-outline" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link className="eth-nav-btn-outline" to="/login">Connexion</Link>
              <Link className="eth-nav-btn-primary" to="/register">S'inscrire</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="eth-icon-btn-nav d-lg-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </nav>

      {/* ── Mobile menu ─────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="eth-mobile-menu">
          <ul className="eth-mobile-links">
            <li><NavLink to="/" onClick={() => setMenuOpen(false)} end>Accueil</NavLink></li>
            <li><NavLink to="/catalogue" onClick={() => setMenuOpen(false)}>Catalogue</NavLink></li>
            <li><NavLink to="/a-propos" onClick={() => setMenuOpen(false)}>À propos</NavLink></li>
            <li><NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink></li>
            <li>
              <Link to="/bio" onClick={() => setMenuOpen(false)} className="eth-mobile-bio-pill">
                <i className="fa-solid fa-leaf me-2"></i>Bio &amp; Naturel
              </Link>
            </li>
          </ul>
          <div className="eth-mobile-actions">
            <Link to="/panier" className="eth-mobile-icon-row" onClick={() => setMenuOpen(false)}>
              <i className="fa-solid fa-bag-shopping me-2"></i>
              Panier {itemCount > 0 && <span className="eth-cart-badge ms-2">{itemCount}</span>}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/favoris" className="eth-mobile-icon-row" onClick={() => setMenuOpen(false)}>
                  <i className="fa-regular fa-heart me-2"></i>Favoris
                </Link>
                <Link to="/compte" className="eth-mobile-icon-row" onClick={() => setMenuOpen(false)}>
                  <i className="fa-solid fa-user me-2"></i>Mon compte
                </Link>
                <button className="eth-nav-btn-outline w-100 mt-2" onClick={() => { setMenuOpen(false); handleLogout(); }}>
                  Déconnexion
                </button>
              </>
            ) : (
              <div className="d-flex gap-2 mt-2">
                <Link to="/login" className="eth-nav-btn-outline flex-fill text-center" onClick={() => setMenuOpen(false)}>
                  Connexion
                </Link>
                <Link to="/register" className="eth-nav-btn-primary flex-fill text-center" onClick={() => setMenuOpen(false)}>
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
