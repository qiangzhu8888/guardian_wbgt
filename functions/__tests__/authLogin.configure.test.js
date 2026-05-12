'use strict';

const bcrypt = require('bcryptjs');

const loginPassword = 'password12345';
const mockPasswordHash = bcrypt.hashSync(loginPassword, 8);

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (name) => {
      if (name === 'orgs') {
        return {
          doc: () => ({
            get: async () => ({ exists: false }),
          }),
        };
      }
      if (name !== 'users') {
        return {
          where: () => ({
            limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
          }),
        };
      }
      const userDoc = {
        id: 'user-1',
        data: () => ({
          email: 'admin@test.local',
          passwordHash: mockPasswordHash,
          role: 'admin',
          orgId: 'default',
        }),
      };
      return {
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: false, docs: [userDoc] }),
          }),
        }),
      };
    },
  }),
}));

describe('/api/auth/login', () => {
  const request = require('supertest');

  let envSnapshot;

  beforeEach(() => {
    envSnapshot = {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
      FUNCTIONS_EMULATOR: process.env.FUNCTIONS_EMULATOR,
      FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
    };
    jest.resetModules();
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_SECRET;
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.FIRESTORE_EMULATOR_HOST;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(envSnapshot)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('returns 200 when only FIRESTORE_EMULATOR_HOST is set (jwt fallback)', async () => {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.BUILDICS_API_KEY = process.env.BUILDICS_API_KEY || 'test';
    const { createApiApp } = require('../apiServer');
    const app = createApiApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: loginPassword });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.orgSlug).toBe('default');
  });

  it('returns 503 when JWT is unset and not in emulator mode', async () => {
    delete process.env.FIRESTORE_EMULATOR_HOST;
    process.env.BUILDICS_API_KEY = process.env.BUILDICS_API_KEY || 'test';
    const { createApiApp } = require('../apiServer');
    const app = createApiApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: loginPassword });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe(503);
    expect(String(res.body.msg)).toMatch(/JWT/);
  });
});
