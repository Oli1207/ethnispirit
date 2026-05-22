import { useEffect } from 'react';

/**
 * Switche le favicon du navigateur selon le mode.
 * @param {'mode' | 'bio'} variant
 */
export default function useFavicon(variant) {
  useEffect(() => {
    const href = variant === 'bio'
      ? '/icons/favicon-bio.png'
      : '/icons/favicon-mode.png';

    // Met à jour toutes les balises <link rel="icon"> existantes
    const links = document.querySelectorAll("link[rel~='icon']");
    links.forEach((el) => { el.href = href; });

    // Si aucune balise icon n'existe encore, on en crée une
    if (links.length === 0) {
      const link = document.createElement('link');
      link.rel  = 'icon';
      link.type = 'image/png';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [variant]);
}
