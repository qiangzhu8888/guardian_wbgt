'use strict';

const request = require('supertest');

process.env.FUNCTIONS_EMULATOR = 'true';
process.env.BUILDICS_API_KEY = 'test-key';
process.env.JWT_ACCESS_SECRET = 'jest-access-secret';

jest.mock('firebase-admin/firestore', () => {
  const emptySnap = { empty: true, forEach: () => {} };
  const chain = {
    where() {
      return this;
    },
    limit() {
      return this;
    },
    get: async () => emptySnap,
  };
  return {
    getFirestore: () => ({
      collection: (name) => {
        if (name === 'auditLogs') {
          return { add: jest.fn(async () => ({})) };
        }
        return {
          ...chain,
          doc: () => ({
            get: async () => ({ exists: false, data: () => null }),
          }),
        };
      },
    }),
  };
});

const { createApiApp } = require('../apiServer');

describe('api /api/buildics', () => {
  const app = createApiApp();

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, data: [] }),
      }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects disallowed path', async () => {
    const res = await request(app)
      .post('/api/buildics?path=/evil')
      .send([]);
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown org slug on buildics', async () => {
    const res = await request(app)
      .post('/api/buildics?path=/common/device/queryDeviceData&orgSlug=nonexistent-xyz')
      .send([]);
    expect(res.status).toBe(404);
  });

  it('proxies allowed path with empty device list', async () => {
    const res = await request(app)
      .post('/api/buildics?path=/common/device/queryDeviceData')
      .send([]);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('api /api/public/config', () => {
  const app = createApiApp();

  it('returns 404 for unknown org slug', async () => {
    const res = await request(app).get('/api/public/config?orgSlug=nonexistent-xyz');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
  });

  it('returns 200 for default org slug fallback', async () => {
    const prev = process.env.DEFAULT_ORG_SLUG;
    process.env.DEFAULT_ORG_SLUG = 'default';
    try {
      const res = await request(app).get('/api/public/config?orgSlug=default');
      expect(res.status).toBe(200);
      expect(res.body.orgSlug).toBe('default');
    } finally {
      if (prev === undefined) delete process.env.DEFAULT_ORG_SLUG;
      else process.env.DEFAULT_ORG_SLUG = prev;
    }
  });
});

describe('api requireAuth', () => {
  const app = createApiApp();
  const jwt = require('jsonwebtoken');

  it('returns 401 without Authorization for admin devices', async () => {
    const res = await request(app).get('/api/admin/devices');
    expect(res.status).toBe(401);
  });

  it('returns 401 without Bearer', async () => {
    const res = await request(app).get('/api/admin/devices').set('Authorization', 'Basic x');
    expect(res.status).toBe(401);
  });

  it('returns 403 when role is viewer', async () => {
    const token = jwt.sign(
      { sub: 'u1', role: 'viewer', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app).get('/api/admin/devices').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows admin role', async () => {
    const token = jwt.sign(
      { sub: 'u1', role: 'admin', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app).get('/api/admin/devices').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });

  it('returns org-settings without exposing buildics key', async () => {
    const token = jwt.sign(
      { sub: 'u1', role: 'admin', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app).get('/api/admin/org-settings').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.orgId).toBe('default');
    expect(res.body.data).not.toHaveProperty('buildicsApiKey');
  });

  it('allows superadmin to use admin devices route', async () => {
    const token = jwt.sign(
      { sub: 'u2', role: 'superadmin', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app).get('/api/admin/devices').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });

  it('GET /api/admin/geocode returns coordinates when GSI returns a hit', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [
          {
            geometry: { coordinates: [139.767125, 35.681236] },
            properties: { title: '東京都渋谷区...' },
          },
        ],
      }),
    );
    const token = jwt.sign(
      { sub: 'u1', role: 'admin', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app)
      .get('/api/admin/geocode?q=' + encodeURIComponent('東京都渋谷区神南'))
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.lat).toBeCloseTo(35.681236, 5);
    expect(res.body.lng).toBeCloseTo(139.767125, 5);
    expect(res.body.label).toBe('東京都渋谷区...');
    jest.restoreAllMocks();
  });

  it('GET /api/admin/location-conditions returns weather + wbgt (mocked Open-Meteo)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { time: '2025-06-20T12:00', temperature_2m: 28.5, relative_humidity_2m: 60 },
      }),
    });
    delete process.env.JWA_X_API_KEY;
    delete process.env.JWA_APIKEY;
    const token = jwt.sign(
      { sub: 'u1', role: 'admin', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app)
      .get('/api/admin/location-conditions?lat=35.68&lon=139.76')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.tempCelsius).toBe(28.5);
    expect(res.body.humidityPercent).toBe(60);
    expect(res.body.wbgtSource).toBe('unavailable');
    expect(res.body.wbgtCelsius).toBeNull();
    expect(res.body.jwaConfigured).toBe(false);
    expect(typeof res.body.jwaMessage).toBe('string');
    expect(res.body.jwaMessage.length).toBeGreaterThan(0);
    jest.restoreAllMocks();
  });

  it('GET /api/admin/location-conditions returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/location-conditions?lat=1&lon=2');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/geocode returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/geocode?q=' + encodeURIComponent('東京都渋谷'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for admin on platform orgs', async () => {
    const token = jwt.sign(
      { sub: 'u1', role: 'admin', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app).get('/api/admin/platform/orgs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 for superadmin on platform orgs list', async () => {
    const token = jwt.sign(
      { sub: 'u2', role: 'superadmin', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app).get('/api/admin/platform/orgs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 200 for superadmin on platform users list', async () => {
    const token = jwt.sign(
      { sub: 'u2', role: 'superadmin', orgId: 'default' },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
    const res = await request(app).get('/api/admin/platform/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('api bootstrap-superadmin', () => {
  const app = createApiApp();

  it('returns 403 without X-Bootstrap-Secret', async () => {
    const res = await request(app)
      .post('/api/auth/bootstrap-superadmin')
      .send({ email: 's@example.com', password: '12345678' });
    expect(res.status).toBe(403);
  });

  it('returns 403 with wrong secret', async () => {
    const prev = process.env.AUTH_BOOTSTRAP_SECRET;
    process.env.AUTH_BOOTSTRAP_SECRET = 'correct-bootstrap-secret';
    try {
      const res = await request(app)
        .post('/api/auth/bootstrap-superadmin')
        .set('X-Bootstrap-Secret', 'wrong')
        .send({ email: 's@example.com', password: '12345678' });
      expect(res.status).toBe(403);
    } finally {
      if (prev === undefined) delete process.env.AUTH_BOOTSTRAP_SECRET;
      else process.env.AUTH_BOOTSTRAP_SECRET = prev;
    }
  });
});
