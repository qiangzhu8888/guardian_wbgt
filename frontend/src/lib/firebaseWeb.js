import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Vite の import.meta.env から Firebase Web 設定を組み立てる。
 * 必須キーが欠けるときは null（初期化スキップ）。
 *
 * @param {ImportMeta['env']} env
 * @returns {import('firebase/app').FirebaseOptions | null}
 */
export function buildFirebaseWebConfig(env) {
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const appId = env.VITE_FIREBASE_APP_ID;
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN;
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  if (!apiKey || !projectId || !appId || !authDomain || !storageBucket || !messagingSenderId) {
    return null;
  }
  const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID;
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

/**
 * ブラウザで Firebase を初期化し、measurementId があるときだけ Analytics を有効化する。
 * 環境変数未設定なら何もしない。
 */
export async function initFirebaseWeb() {
  if (typeof window === 'undefined') return;
  const cfg = buildFirebaseWebConfig(import.meta.env);
  if (!cfg) return;
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  if (cfg.measurementId && (await isSupported())) {
    getAnalytics(app);
  }
}
