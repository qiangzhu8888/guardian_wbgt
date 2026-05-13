import { describe, expect, it } from 'vitest';
import { buildFirebaseWebConfig } from './firebaseWeb';

describe('buildFirebaseWebConfig', () => {
  it('必須が揃えばオブジェクトを返す', () => {
    const cfg = buildFirebaseWebConfig({
      VITE_FIREBASE_API_KEY: 'k',
      VITE_FIREBASE_AUTH_DOMAIN: 'x.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'p',
      VITE_FIREBASE_STORAGE_BUCKET: 'p.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
      VITE_FIREBASE_APP_ID: '1:1:web:abc',
      VITE_FIREBASE_MEASUREMENT_ID: 'G-TEST',
    });
    expect(cfg).toEqual({
      apiKey: 'k',
      authDomain: 'x.firebaseapp.com',
      projectId: 'p',
      storageBucket: 'p.appspot.com',
      messagingSenderId: '1',
      appId: '1:1:web:abc',
      measurementId: 'G-TEST',
    });
  });

  it('measurementId が無ければフィールドごと省略', () => {
    const cfg = buildFirebaseWebConfig({
      VITE_FIREBASE_API_KEY: 'k',
      VITE_FIREBASE_AUTH_DOMAIN: 'x.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'p',
      VITE_FIREBASE_STORAGE_BUCKET: 'p.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
      VITE_FIREBASE_APP_ID: '1:1:web:abc',
    });
    expect(cfg).not.toHaveProperty('measurementId');
  });

  it('必須が欠けると null', () => {
    expect(
      buildFirebaseWebConfig({
        VITE_FIREBASE_API_KEY: 'k',
        VITE_FIREBASE_PROJECT_ID: 'p',
      }),
    ).toBeNull();
  });
});
