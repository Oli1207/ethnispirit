/**
 * useTracking — Hook central du système analytics EthniSpirit
 *
 * Gère :
 *  - La session anonyme (UUID en localStorage)
 *  - La capture des UTM params à l'arrivée
 *  - L'envoi de la session au backend (1 seule fois par session)
 *  - L'envoi d'événements (add_to_cart, purchase, etc.)
 */

import { useCallback, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axios';

const SESSION_KEY = 'eth_session_id';
const UTM_KEY     = 'eth_utm';
const COUPON_KEY  = 'eth_coupon';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function captureUTM() {
  const params = new URLSearchParams(window.location.search);
  const utm = {
    utm_source:   params.get('utm_source')   || '',
    utm_medium:   params.get('utm_medium')   || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content:  params.get('utm_content')  || '',
  };
  // Ne persiste que si au moins une valeur UTM est présente
  if (utm.utm_source || utm.utm_campaign) {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  }
  // Capture le coupon si présent dans l'URL
  const coupon = params.get('coupon') || params.get('promo') || params.get('code');
  if (coupon) {
    localStorage.setItem(COUPON_KEY, coupon.toUpperCase());
  }
  return utm;
}

// ── Coupon depuis URL ─────────────────────────────────────────────────────────
export function getStoredCoupon() {
  return localStorage.getItem(COUPON_KEY) || '';
}

export function setStoredCoupon(code) {
  if (code) localStorage.setItem(COUPON_KEY, code.toUpperCase());
}

export function clearStoredCoupon() {
  localStorage.removeItem(COUPON_KEY);
}

function getSavedUTM() {
  try {
    return JSON.parse(localStorage.getItem(UTM_KEY) || '{}');
  } catch {
    return {};
  }
}

// ── Envoi silencieux (ignore les erreurs réseau) ──────────────────────────────

async function silentPost(url, data) {
  try {
    await axiosInstance.post(url, data);
  } catch {
    // Tracking ne doit jamais bloquer l'UX
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export default function useTracking() {
  const sessionId  = useRef(getOrCreateSessionId());
  const initialized = useRef(false);

  // ── Initialisation de la session (1 seule fois par chargement) ───────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const utm = captureUTM();
    const savedUtm = getSavedUTM();
    const finalUtm = utm.utm_source ? utm : savedUtm;

    silentPost('/api/track/session/', {
      session_id:   sessionId.current,
      referrer:     document.referrer,
      landing_page: window.location.pathname + window.location.search,
      ...finalUtm,
    });
  }, []);

  // ── Envoi d'un événement ─────────────────────────────────────────────────
  const trackEvent = useCallback((eventType, data = {}) => {
    silentPost('/api/track/event/', {
      session_id: sessionId.current,
      event_type: eventType,
      page_url:   window.location.pathname,
      ...data,
    });
  }, []);

  return { sessionId: sessionId.current, trackEvent };
}

// ── Fonction standalone (hors composant React) ────────────────────────────────
export function trackEventStandalone(eventType, data = {}) {
  const sessionId = localStorage.getItem(SESSION_KEY) || '';
  if (!sessionId) return;
  silentPost('/api/track/event/', {
    session_id: sessionId,
    event_type: eventType,
    page_url:   window.location.pathname,
    ...data,
  });
}

// ── Récupère les UTM stockés (pour les passer au checkout) ───────────────────
export function getStoredUTM() {
  return getSavedUTM();
}
