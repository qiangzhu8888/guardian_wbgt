'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.FUNCTIONS_EMULATOR = 'true';
process.env.BUILDICS_API_KEY = 'test-key';
process.env.JWT_ACCESS_SECRET = 'acceptance-jwt-secret';

const { createMemoryFirestoreLedger, firestoreModuleFactory } = require('./helpers/memoryFirestoreLedger');

function adminToken(orgId = 'default') {
  return jwt.sign(
    { sub: 'accept-u1', role: 'admin', orgId },
    process.env.JWT_ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: '10m' },
  );
}

describe('acceptance: dashboard display & BUILDICS', () => {
  let app;
  let db;

  beforeEach(() => {
    jest.resetModules();
    db = createMemoryFirestoreLedger({
      orgs: {
        default: { slug: 'default', name: 'Default' },
      },
      facilities: {
        '1': { orgId: 'default', name: '校庭', sortOrder: 0, disabled: false },
      },
      devices: {
        '111111111111': {
          orgId: 'default',
          facilityId: 1,
          label: 'A',
          disabled: false,
          dashboardDisplay: true,
          updatedAt: 100,
        },
        '222222222222': {
          orgId: 'default',
          facilityId: 1,
          label: 'B',
          disabled: false,
          dashboardDisplay: false,
          updatedAt: 200,
        },
      },
    });

    jest.doMock('firebase-admin/firestore', () => firestoreModuleFactory(db));
    jest.doMock('firebase-admin', () => ({
      firestore: () => require('firebase-admin/firestore'),
    }));

    ({ createApiApp } = require('../apiServer'));
    app = createApiApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/public/config exposes one deviceMapping per facility (dashboard pick)', async () => {
    const res = await request(app).get('/api/public/config?orgSlug=default');
    expect(res.status).toBe(200);
    const mappings = res.body.deviceMappings || [];
    const atFacility1 = mappings.filter((m) => m.facilityId === 1);
    expect(atFacility1).toHaveLength(1);
    expect(atFacility1[0].deviceId).toBe('111111111111');
  });

  it('GET /api/admin/devices reports sibling count and effective display', async () => {
    const res = await request(app)
      .get('/api/admin/devices')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    const a = res.body.data.find((r) => r.deviceId === '111111111111');
    const b = res.body.data.find((r) => r.deviceId === '222222222222');
    expect(a.facilitySiblingCount).toBe(2);
    expect(a.dashboardDisplayEffective).toBe(true);
    expect(b.dashboardDisplayEffective).toBe(false);
  });

  it('PATCH dashboardDisplay promotes device for public config', async () => {
    const patch = await request(app)
      .patch('/api/admin/devices/222222222222')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ dashboardDisplay: true });
    expect(patch.status).toBe(200);

    const cfg = await request(app).get('/api/public/config?orgSlug=default');
    const fid1 = (cfg.body.deviceMappings || []).find((m) => m.facilityId === 1);
    expect(fid1.deviceId).toBe('222222222222');
  });

  it('POST /api/admin/org-settings/buildics-test succeeds when upstream returns 200', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, data: [] }),
      }),
    );

    const res = await request(app)
      .post('/api/admin/org-settings/buildics-test')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ buildicsApiKey: 'probe-key' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.keySource).toBe('input');
  });

  it('GET /api/admin/devices/probe marks placeholder ID as demo', async () => {
    const res = await request(app)
      .get('/api/admin/devices/probe?deviceId=111111111111')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.sourceKind).toBe('demo');
    expect(res.body.sourceReason).toBe('placeholder');
  });
});
