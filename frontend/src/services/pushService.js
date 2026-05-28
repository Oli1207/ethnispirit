/**
 * Service Web Push — EthniSpirit
 * Gère l'inscription / désinscription aux notifications push.
 */
import { pushAPI } from '../utils/api';

/**
 * Convertit une clé VAPID base64url en Uint8Array.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Vérifie si le navigateur supporte les notifications push.
 */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager'   in window    &&
    'Notification'  in window
  );
}

/**
 * Demande la permission de notifications et abonne l'utilisateur.
 * @param {string[]} universes  [] = tous, ['mode'] = Mode seulement, etc.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function subscribeToPush(universes = []) {
  if (!isPushSupported()) {
    return { success: false, message: 'Votre navigateur ne supporte pas les notifications push.' };
  }

  // 1. Demander la permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, message: 'Permission de notification refusée.' };
  }

  try {
    // 2. Récupérer la clé VAPID publique
    const { data } = await pushAPI.vapidKey();
    const applicationServerKey = urlBase64ToUint8Array(data.public_key);

    // 3. Récupérer le service worker enregistré
    const registration = await navigator.serviceWorker.ready;

    // 4. S'abonner
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey,
    });

    // 5. Envoyer la souscription au backend
    const sub = subscription.toJSON();
    await pushAPI.subscribe({
      endpoint:  sub.endpoint,
      keys:      sub.keys,
      universes,
    });

    return { success: true, message: 'Notifications activées !' };
  } catch (err) {
    console.error('pushService.subscribe:', err);
    return { success: false, message: 'Impossible d\'activer les notifications.' };
  }
}

/**
 * Désabonne l'utilisateur des notifications push.
 * @returns {Promise<{success: boolean}>}
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return { success: true };

    await pushAPI.unsubscribe({ endpoint: subscription.endpoint });
    await subscription.unsubscribe();
    return { success: true };
  } catch (err) {
    console.error('pushService.unsubscribe:', err);
    return { success: false };
  }
}

/**
 * Vérifie si l'utilisateur est déjà abonné.
 * @returns {Promise<boolean>}
 */
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}
