import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { setStoredCoupon } from '../hooks/useTracking';

const STORAGE_KEY = 'eth_welcome_shown';

// Palette par univers
const THEME = {
  mode: {
    accent:      'var(--tc-classic)',
    accentLight: 'rgba(198,93,59,.1)',
    accentBorder:'rgba(198,93,59,.25)',
    ctaStyle:    { background: 'var(--tc-classic)', color: '#fff' },
    iconStyle:   { background: 'rgba(198,93,59,.12)', color: 'var(--tc-classic)' },
  },
  bio: {
    accent:      'var(--bio-main)',
    accentLight: 'rgba(45,90,46,.1)',
    accentBorder:'rgba(45,90,46,.25)',
    ctaStyle:    { background: 'var(--bio-main)', color: '#fff' },
    iconStyle:   { background: 'rgba(45,90,46,.12)', color: 'var(--bio-main)' },
  },
  all: {
    accent:      'var(--tc-classic)',
    accentLight: 'rgba(198,93,59,.1)',
    accentBorder:'rgba(198,93,59,.25)',
    ctaStyle:    { background: 'var(--tc-classic)', color: '#fff' },
    iconStyle:   { background: 'rgba(198,93,59,.12)', color: 'var(--tc-classic)' },
  },
};

/**
 * currentUniverse : 'mode' | 'bio'
 * Fourni par le layout parent pour filtrer les modaux non destinés à cet univers.
 */
export default function WelcomeModal({ currentUniverse = 'mode' }) {
  const [settings, setSettings] = useState(null);
  const [visible,  setVisible]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    axiosInstance.get('/api/welcome-promo/')
      .then(({ data }) => {
        if (!data.is_active) return;
        // N'afficher que si l'univers correspond (ou si 'all')
        if (data.universe !== 'all' && data.universe !== currentUniverse) return;
        setSettings(data);
        const delay = (data.delay_seconds || 3) * 1000;
        setTimeout(() => setVisible(true), delay);
      })
      .catch(() => {});
  }, [currentUniverse]);

  function handleClose() {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  function handleProfiter() {
    // Stocke le code → CartScreen l'appliquera automatiquement
    setStoredCoupon(settings.promo_code);
    handleClose();
    // Navigue vers le catalogue du bon univers
    navigate(currentUniverse === 'bio' ? '/bio/catalogue' : '/catalogue');
  }

  if (!visible || !settings) return null;

  const theme = THEME[settings.universe] || THEME.all;

  return (
    <>
      {/* Backdrop */}
      <div className="eth-wm-backdrop" onClick={handleClose} />

      {/* Modal */}
      <div className="eth-wm" role="dialog" aria-modal="true" aria-label={settings.title}>

        {/* Bouton fermer */}
        <button className="eth-wm-close" onClick={handleClose} aria-label="Fermer">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Icône cadeau */}
        <div className="eth-wm-icon" style={theme.iconStyle}>
          <i className="fa-solid fa-gift" style={{ color: theme.iconStyle.color }}></i>
        </div>

        {/* Contenu */}
        <p className="eth-wm-subtitle">{settings.subtitle}</p>
        <h2 className="eth-wm-title">{settings.title}</h2>

        {settings.body_text && (
          <p className="eth-wm-body">{settings.body_text}</p>
        )}

        {/* Bloc code promo */}
        <div className="eth-wm-code-block" style={{ borderColor: theme.accentBorder, background: theme.accentLight }}>
          <div className="eth-wm-discount" style={{ color: theme.accent }}>{settings.discount_text}</div>
          <div className="eth-wm-code-row">
            <span className="eth-wm-code" style={{ color: theme.accent }}>{settings.promo_code}</span>
          </div>
          <p className="eth-wm-hint">Code appliqué automatiquement à votre panier</p>
        </div>

        {/* CTA principal — "Profiter" */}
        <button
          className="eth-wm-cta"
          style={theme.ctaStyle}
          onClick={handleProfiter}
        >
          <i className="fa-solid fa-bolt me-2"></i>
          Profiter de l'offre
        </button>

        {/* Lien fermer discret */}
        <button
          onClick={handleClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-light)', marginTop: 10, padding: '4px 0' }}
        >
          Non merci, continuer sans code
        </button>
      </div>
    </>
  );
}
