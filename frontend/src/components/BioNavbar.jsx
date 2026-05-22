import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import useCartStore from '../store/cart';
import logoBio from '../assets/logo_ethnispirit_bio.png';
import useFavicon from '../hooks/useFavicon';

export default function BioNavbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const cart = useCartStore((s) => s.cart);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  useFavicon('bio');

  function handleLogout() {
    logout();
    navigate('/bio');
  }

  return (
    <>
      {/* ── Bio Top Bar ─────────────────────────────────────────────────── */}
      <div className="bio-top-bar">
        <div className="bio-top-bar-item">
          <i className="fa-solid fa-seedling"></i>
          100% Naturel &amp; Certifié Bio
        </div>
        <span className="sep">|</span>
        <div className="bio-top-bar-item">
          <i className="fa-solid fa-truck-fast"></i>
          Livraison Martinique &amp; Guadeloupe
        </div>
        <span className="sep">|</span>
        <div className="bio-top-bar-item">
          <i className="fa-solid fa-hand-holding-heart"></i>
          Commerce équitable
        </div>
        <Link to="/" className="bio-back-mode ms-auto">
          <i className="fa-solid fa-shirt"></i>
          Mode Antillaise
        </Link>
      </div>

      {/* ── Bio Navbar ──────────────────────────────────────────────────── */}
      <nav className="bio-navbar">
        {/* Logo */}
        <Link className="bio-nav-logo" to="/bio">
          <img
            src={logoBio}
            alt="EthniSpirit Natural"
            className="bio-nav-logo-img"
          />
        </Link>

        {/* Nav links — centre */}
        <ul className="bio-nav-links d-none d-lg-flex">
          <li>
            <NavLink to="/bio" className={({ isActive }) => isActive ? 'active' : ''} end>
              Accueil Bio
            </NavLink>
          </li>
          <li>
            <NavLink to="/bio/catalogue" className={({ isActive }) => isActive ? 'active' : ''}>
              Produits Bio
            </NavLink>
          </li>
          <li>
            <NavLink to="/bio/a-propos" className={({ isActive }) => isActive ? 'active' : ''}>
              À propos
            </NavLink>
          </li>
          <li className="bio-mode-nav-pill">
            <Link to="/">
              <i className="fa-solid fa-shirt"></i>
              Mode Antillaise
            </Link>
          </li>
        </ul>

        {/* Actions droite */}
        <div className="bio-nav-actions d-none d-lg-flex">
          <Link className="bio-icon-btn-nav" to="/panier" title="Panier">
            <i className="fa-solid fa-bag-shopping"></i>
            {itemCount > 0 && <span className="bio-cart-badge">{itemCount}</span>}
          </Link>

          {isAuthenticated ? (
            <>
              <Link className="bio-icon-btn-nav" to="/compte" title="Mon compte">
                <i className="fa-solid fa-user"></i>
              </Link>
              <button className="bio-nav-btn-primary" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <Link className="bio-nav-btn-primary" to="/login">Connexion</Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="bio-icon-btn-nav d-lg-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </nav>

      {/* ── Mobile menu ─────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="bio-mobile-menu">
          <ul className="bio-mobile-links">
            <li><NavLink to="/bio" onClick={() => setMenuOpen(false)} end>Accueil Bio</NavLink></li>
            <li><NavLink to="/bio/catalogue" onClick={() => setMenuOpen(false)}>Produits Bio</NavLink></li>
            <li><NavLink to="/bio/a-propos" onClick={() => setMenuOpen(false)}>À propos</NavLink></li>
            <li>
              <Link to="/" onClick={() => setMenuOpen(false)} className="bio-mobile-mode-pill">
                <i className="fa-solid fa-shirt me-2"></i>Mode Antillaise
              </Link>
            </li>
          </ul>
          <div className="bio-mobile-actions">
            <Link to="/panier" className="bio-mobile-icon-row" onClick={() => setMenuOpen(false)}>
              <i className="fa-solid fa-bag-shopping me-2"></i>
              Panier {itemCount > 0 && <span className="bio-cart-badge ms-2">{itemCount}</span>}
            </Link>
            {isAuthenticated ? (
              <button className="bio-nav-btn-primary w-100 mt-2" onClick={() => { setMenuOpen(false); handleLogout(); }}>
                Déconnexion
              </button>
            ) : (
              <Link to="/login" className="bio-nav-btn-primary d-block text-center mt-2" onClick={() => setMenuOpen(false)}>
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
