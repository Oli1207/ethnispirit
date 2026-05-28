/**
 * Service Worker EthniSpirit — Push Notifications + Workbox Caching
 * Stratégie : injectManifest (VitePWA)
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// ── Précache (injecté par VitePWA) ────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Runtime caching ───────────────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/products/'),
  new NetworkFirst({
    cacheName: 'api-products-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 5 })],
  }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/media/'),
  new CacheFirst({
    cacheName: 'media-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'EthniSpirit', body: event.data.text(), url: '/' };
  }

  const { title, body, url, icon, event_type } = payload;

  const options = {
    body:    body || '',
    icon:    icon || '/icons/icon-192.png',
    badge:   '/icons/icon-72.png',
    data:    { url: url || '/' },
    tag:     event_type || 'ethnispirit-notification',
    renotify: true,
    vibrate: [200, 100, 200],
  };

  // Couleur de notification selon le type
  if (event_type === 'new_order' || event_type === 'payment_confirmed') {
    options.icon = '/icons/icon-192.png';
  }

  event.waitUntil(
    self.registration.showNotification(title || 'EthniSpirit', options),
  );
});

// ── Clic sur notification ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la mettre au premier plan
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Sinon ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});

// ── Skip waiting pour mise à jour immédiate ───────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
