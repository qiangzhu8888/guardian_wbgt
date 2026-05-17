#!/usr/bin/env node
/**
 * firebase-messaging のバックグラウンド用 Service Worker を生成する。
 * Firebase Console と VITE_FIREBASE_* / VITE_FIREBASE_VAPID_KEY を環境変数または frontend/.env* に用意したうえで prebuild で実行すること。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadMergedEnv(dir) {
  /** @type {Record<string,string>} */
  const out = {};
  for (const rel of ['.env.production.local', '.env.local', '.env.development.local', '.env']) {
    const p = resolve(dir, rel);
    if (!existsSync(p)) continue;
    try {
      const txt = readFileSync(p, 'utf8');
      for (const lineRaw of txt.split(/\r?\n/)) {
        const line = lineRaw.trim();
        if (!line || line.startsWith('#')) continue;
        const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
        if (!m) continue;
        let v = m[2] ?? '';
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }
        out[m[1]] = v.trim();
      }
    } catch {
      continue;
    }
  }
  return out;
}

function main() {
  const cwd = resolve(__dirname, '..');
  const env = { ...process.env, ...loadMergedEnv(cwd) };

  const firebaseVersion = '11.6.0';
  /** @template T @param {undefined|null|string} x @returns {string} */
  const get = (k) => env[k]?.trim?.() || '';

  const vals = {
    apiKey: get('VITE_FIREBASE_API_KEY'),
    authDomain: get('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: get('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: get('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: get('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: get('VITE_FIREBASE_APP_ID'),
  };

  const complete =
    Boolean(vals.apiKey && vals.authDomain && vals.projectId && vals.storageBucket && vals.messagingSenderId && vals.appId);

  const outPath = resolve(cwd, 'public/firebase-messaging-sw.js');
  mkdirSync(resolve(cwd, 'public'), { recursive: true });

  /** @type {string} */
  let body;
  if (complete) {
    body = `
/** 
 * Firebase Cloud Messaging のバックグラウンド処理（自動生成: scripts/gen-firebase-messaging-sw.mjs）
 */
/* eslint-disable no-undef,no-unused-vars */

importScripts(${JSON.stringify(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js`)});
importScripts(${JSON.stringify(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging-compat.js`)});

firebase.initializeApp(${JSON.stringify(vals, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notification = payload.notification || {};
  const title = notification.title || 'BUILDICS-GUARDIAN';
  const bodyText = notification.body || '';
  const opts = {
    body: bodyText,
    icon: '/pwa-192.png',
    badge: '/pwa-icon.svg',
    tag: payload.data ? String(payload.data.type || payload.data.kind || 'general') : 'general',
    renotify: true,
    vibrate: [120, 120],
    data: payload.data ? payload.data : {},
  };
  return self.registration.showNotification(title, opts);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

`;
  } else {
    body = `
/**
 * Firebase メッセージング用サービスワーカーは、VITE_FIREBASE_* が設定されたビルドで生成されます。
 * 開発時のみプレースホルダになりますが、開発サーバーは動作します。
 */
console.warn('[firebase-messaging-sw.js] Firebase Web 構成が未完のため、バックグラウンド通知のみ無効です。');
`;
  }

  writeFileSync(outPath, body.trimEnd() + '\n', 'utf8');
}

main();
