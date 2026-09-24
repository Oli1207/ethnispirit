import { useEffect, useRef, useState } from 'react';
import { loadQueued } from '../utils/imageQueue';

/**
 * <img> qui ne télécharge que lorsqu'elle approche de l'écran, à son tour dans la file
 * (6 images à la fois max), avec nouvelles tentatives automatiques en cas d'échec.
 * Voir utils/imageQueue.js pour le pourquoi.
 * À utiliser pour les listes de produits/catégories ; les images « héros » restent des <img>.
 */
export default function QueuedImage({ src, alt = '', ...imgProps }) {
  const ref = useRef(null);
  const doneRef = useRef(null);                 // src déjà chargée (évite de recharger en re-scrollant)
  const [readySrc, setReadySrc] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return undefined;
    let cancel = null;
    const finish = () => { doneRef.current = src; setReadySrc(src); };
    const start = () => {
      if (cancel || doneRef.current === src) return;
      cancel = loadQueued(src, { onLoad: finish, onGiveUp: finish }); // abandon : on laisse le navigateur essayer nativement
    };
    const stop = () => { if (cancel) { cancel(); cancel = null; } };
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => { io.disconnect(); stop(); };
  }, [src]);

  const ready = readySrc === src;
  return (
    <img
      ref={ref}
      src={ready ? src : undefined}
      alt={ready ? alt : ''}
      decoding="async"
      {...imgProps}
    />
  );
}
