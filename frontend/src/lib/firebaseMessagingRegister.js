import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { ensureFirebaseWebApp } from './firebaseWeb';

/**
 * firebase Cloud Messaging が利用するサービスワーカーを登録・解決します。
 */
async function resolveMessagingServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  const controllingFirebase = Boolean(
    existing?.active?.scriptURL?.includes?.('firebase-messaging-sw'),
  );
  if (!controllingFirebase) {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
    } catch (e) {
      console.warn('firebase-messaging-sw register failed — PWA と競合している可能性があります。', e);
    }
  }

  /** @returns {Promise<ServiceWorkerRegistration>} */
  const ready = navigator.serviceWorker.ready;
  return ready;
}

/**
 * FCM デバイストークンを取得し BFF に登録する。
 * @param {(path: string, init?: RequestInit) => Promise<Response>} adminApiFetch
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function registerWebPushWithServer(adminApiFetch) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, error: 'unsupported' };
  }

  const vapid = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapid) {
    return { ok: false, error: 'missing_vapid' };
  }

  const firebaseApp = ensureFirebaseWebApp(import.meta.env);
  if (!firebaseApp) {
    return { ok: false, error: 'missing_firebase_config' };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return { ok: false, error: 'messaging_unsupported' };
  }

  const messaging = getMessaging(firebaseApp);

  /** @type {ServiceWorkerRegistration} */
  const registration = await resolveMessagingServiceWorkerRegistration();

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    return { ok: false, error: 'permission_denied' };
  }

  let token;
  try {
    token = await getToken(messaging, {
      vapidKey: vapid,
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    console.error('getToken failure', err);
    return { ok: false, error: 'get_token_failed' };
  }

  if (!token) {
    return { ok: false, error: 'no_token' };
  }

  const res = await adminApiFetch('/api/me/push-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    return { ok: false, error: 'server_register_failed' };
  }

  return { ok: true };
}

/**
 * @param {(path: string, init?: RequestInit) => Promise<Response>} adminApiFetch
 * @param {string} token
 */
export async function unregisterWebPushOnServer(adminApiFetch, token) {
  const res = await adminApiFetch('/api/me/push-token', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.ok;
}
