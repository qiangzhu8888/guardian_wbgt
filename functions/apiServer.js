'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const defaultPublicConfig = require('./defaults/publicConfig.json');
const {
  ALLOWED_PATHS,
  MAX_BODY_JSON,
  validateDevicePayload,
  extractDeviceIdsFromBuildicsBody,
} = require('./lib/buildicsProxyRules');
const { validateFacilityPayload } = require('./lib/facilityValidation');
const { resolvePublicOrg } = require('./lib/orgResolve');
const {
  createOrgDocument,
  stripOrgForList,
  ERROR_MSG_JA: platformOrgErrorMsg,
  isValidOrgIdForDoc,
} = require('./lib/platformOrg');
const {
  mergeOrgDashboardIntoConfig,
  buildAdminOrgSettingsResponse,
  validateDashboardPatchField,
  normalizeBuildicsApiKeyPatch,
  getBuildicsApiKeyForLedger,
} = require('./lib/orgDashboardMerge');

const BUILDICS_API_BASE = 'https://www.buildics.jp/api';

function facilityToMockCard(id, data) {
  const name = (data.name || `施設 ${id}`).trim();
  return {
    id,
    name,
    wbgt: 28,
    level: '注意',
    wbgtNext: 29,
    weather: '—',
    weatherIcon: '📍',
    temp: 30,
    humidity: 65,
    updated: '—',
    isMock: true,
    ...(data.address ? { address: String(data.address).slice(0, 500) } : {}),
    ...(Number.isFinite(Number(data.lat)) ? { lat: Number(data.lat) } : {}),
    ...(Number.isFinite(Number(data.lng)) ? { lng: Number(data.lng) } : {}),
  };
}

async function orgHasEnabledFacilities(db, oid) {
  const snap = await db.collection('facilities').where('orgId', '==', oid).get();
  let any = false;
  snap.forEach((doc) => {
    if (doc.data().disabled === true) return;
    any = true;
  });
  return any;
}

async function assertDeviceFacilityAllowed(db, oid, facilityId) {
  if (!(await orgHasEnabledFacilities(db, oid))) return null;
  const ref = db.collection('facilities').doc(String(facilityId));
  const doc = await ref.get();
  if (!doc.exists || doc.data().orgId !== oid || doc.data().disabled === true) {
    return '施設マスタに存在する facilityId を指定してください';
  }
  return null;
}

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  if (!raw.trim()) return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(req) {
  const origin = req.get('Origin');
  const allowed = getAllowedOrigins();
  if (origin && allowed.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  if (allowed.length === 1) {
    return {
      'Access-Control-Allow-Origin': allowed[0],
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  return {};
}

function applyCors(res, headers) {
  Object.entries(headers).forEach(([k, v]) => res.set(k, v));
  res.set('Vary', 'Origin');
}

function accessSecret() {
  return (
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.FUNCTIONS_EMULATOR === 'true' ? 'local-emulator-access-secret' : null)
  );
}

function refreshSecret() {
  return (
    process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.FUNCTIONS_EMULATOR === 'true' ? 'local-emulator-refresh-secret' : null)
  );
}

function signAccess(payload) {
  const sec = accessSecret();
  if (!sec) throw new Error('JWT access secret not configured');
  return jwt.sign(payload, sec, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

function signRefresh(payload) {
  const sec = refreshSecret();
  if (!sec) throw new Error('JWT refresh secret not configured');
  return jwt.sign({ ...payload, typ: 'refresh' }, sec, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

function verifyAccess(token) {
  const sec = accessSecret();
  if (!sec) throw new Error('JWT not configured');
  return jwt.verify(token, sec, { algorithms: ['HS256'] });
}

function verifyRefresh(token) {
  const sec = refreshSecret();
  if (!sec) throw new Error('JWT not configured');
  const d = jwt.verify(token, sec, { algorithms: ['HS256'] });
  if (d.typ !== 'refresh') throw new Error('invalid refresh');
  return d;
}

function orgId() {
  return process.env.DEFAULT_ORG_ID || 'default';
}

async function loadPublicConfigFromFirestore(oid) {
  const db = getFirestore();
  const snap = await db
    .collection('devices')
    .where('orgId', '==', oid)
    .get();

  const fromFs = [];
  snap.forEach((doc) => {
    const d = doc.data();
    if (d.disabled === true) return;
    const facilityId = Number(d.facilityId);
    if (!Number.isFinite(facilityId)) return;
    fromFs.push({ deviceId: doc.id, facilityId });
  });

  const base = JSON.parse(JSON.stringify(defaultPublicConfig));
  if (fromFs.length > 0) {
    base.deviceMappings = fromFs;
  }
  base.orgId = oid;

  const facSnap = await db.collection('facilities').where('orgId', '==', oid).get();
  const facList = [];
  facSnap.forEach((doc) => {
    const d = doc.data();
    if (d.disabled === true) return;
    const id = Number(doc.id);
    if (!Number.isFinite(id)) return;
    facList.push({ id, sortOrder: Number(d.sortOrder) || 0, data: d });
  });
  facList.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  if (facList.length > 0) {
    base.mockFacilities = facList.map((f) => facilityToMockCard(f.id, f.data));
  }

  if (process.env.SHOW_DEMO_FORECAST === 'true') {
    base.showDemoForecast = true;
  } else if (process.env.SHOW_DEMO_FORECAST === 'false') {
    base.showDemoForecast = false;
  }
  return base;
}

/**
 * @param {string} oid
 * @param {string} orgSlug
 */
async function loadPublicConfigPayload(oid, orgSlug) {
  const config = await loadPublicConfigFromFirestore(oid);
  const db = getFirestore();
  const orgSnap = await db.collection('orgs').doc(oid).get();
  const merged = orgSnap.exists
    ? mergeOrgDashboardIntoConfig({ ...config }, orgSnap.data())
    : { ...config };
  return { ...merged, orgId: oid, orgSlug };
}

/** @param {{ orgId: string, uid: string, role: string }} user */
async function appendDeviceAudit(user, action, payload) {
  try {
    const db = getFirestore();
    await db.collection('auditLogs').add({
      orgId: user.orgId,
      uid: user.uid,
      role: user.role,
      action,
      payload,
      at: Date.now(),
    });
  } catch (e) {
    console.error('auditLogs write failed', e);
  }
}

async function assertDevicesInLedger(deviceIds, ledgerOrgId) {
  if (process.env.RELAX_DEVICE_SCOPE === 'true') return;
  if (!deviceIds.length) return;
  const db = getFirestore();
  const oid = ledgerOrgId;
  const any = await db.collection('devices').where('orgId', '==', oid).limit(1).get();
  if (any.empty) return;
  for (const id of deviceIds) {
    const ref = db.collection('devices').doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().orgId !== oid || doc.data().disabled === true) {
      const err = new Error('device scope');
      err.code = 403;
      throw err;
    }
  }
}

function createApiApp() {
  const app = express();
  app.use(express.json({ limit: MAX_BODY_JSON }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      applyCors(res, corsHeaders(req));
      res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(204).send('');
    }
    next();
  });

  app.get('/api/public/config', async (req, res) => {
    applyCors(res, corsHeaders(req));
    try {
      const db = getFirestore();
      const { orgId: oid, orgSlug } = await resolvePublicOrg(db, req.query.orgSlug);
      const payload = await loadPublicConfigPayload(oid, orgSlug);
      res.json(payload);
    } catch (e) {
      if (e.httpStatus === 404) {
        return res.status(404).json({ code: 404, msg: '設定が見つかりません' });
      }
      console.error('public config', e);
      res.json(defaultPublicConfig);
    }
  });

  /**
   * @param {string | string[] | null | undefined} requiredRole
   * - `admin`: `admin` と `superadmin` を許可（通常の管理 API）
   * - `['superadmin']`: プラットフォーム API 用
   */
  function requireAuth(requiredRole) {
    return (req, res, next) => {
      applyCors(res, corsHeaders(req));
      const h = req.get('Authorization') || '';
      const m = h.match(/^Bearer\s+(.+)$/i);
      if (!m) return res.status(401).json({ code: 401, msg: '認証が必要です' });
      try {
        const decoded = verifyAccess(m[1]);
        if (!decoded.sub) throw new Error('no sub');
        req.user = {
          uid: decoded.sub,
          role: decoded.role,
          orgId: decoded.orgId || orgId(),
        };
        /** @type {string[] | null} */
        let allowed = null;
        if (requiredRole == null) {
          allowed = null;
        } else if (Array.isArray(requiredRole)) {
          allowed = requiredRole;
        } else if (requiredRole === 'admin') {
          allowed = ['admin', 'superadmin'];
        } else {
          allowed = [requiredRole];
        }
        if (allowed && !allowed.includes(req.user.role)) {
          return res.status(403).json({ code: 403, msg: '権限がありません' });
        }
        next();
      } catch {
        return res.status(401).json({ code: 401, msg: 'トークンが無効です' });
      }
    };
  }

  app.post('/api/auth/login', async (req, res) => {
    applyCors(res, corsHeaders(req));
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ code: 400, msg: 'email と password が必要です' });
    }
    const db = getFirestore();
    const q = await db.collection('users').where('email', '==', email).limit(1).get();
    if (q.empty) {
      return res.status(401).json({ code: 401, msg: '認証に失敗しました' });
    }
    const doc = q.docs[0];
    const u = doc.data();
    const ok = await bcrypt.compare(password, u.passwordHash || '');
    if (!ok) return res.status(401).json({ code: 401, msg: '認証に失敗しました' });

    const payload = { sub: doc.id, role: u.role || 'viewer', orgId: u.orgId || orgId() };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh({ sub: doc.id });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/',
    });
    res.json({
      code: 200,
      accessToken,
      user: { id: doc.id, email: u.email, role: payload.role, orgId: payload.orgId },
    });
  });

  app.post('/api/auth/refresh', async (req, res) => {
    applyCors(res, corsHeaders(req));
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ code: 401, msg: 'Refresh がありません' });
    try {
      const d = verifyRefresh(token);
      const db = getFirestore();
      const doc = await db.collection('users').doc(d.sub).get();
      if (!doc.exists) return res.status(401).json({ code: 401, msg: 'ユーザーが見つかりません' });
      const u = doc.data();
      const payload = { sub: doc.id, role: u.role || 'viewer', orgId: u.orgId || orgId() };
      res.json({ code: 200, accessToken: signAccess(payload) });
    } catch {
      return res.status(401).json({ code: 401, msg: 'Refresh が無効です' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    applyCors(res, corsHeaders(req));
    res.clearCookie('refresh_token', { path: '/' });
    res.json({ code: 200, msg: 'ok' });
  });

  app.post('/api/auth/bootstrap', async (req, res) => {
    applyCors(res, corsHeaders(req));
    const secret = req.get('X-Bootstrap-Secret');
    if (!secret || secret !== process.env.AUTH_BOOTSTRAP_SECRET) {
      return res.status(403).json({ code: 403, msg: 'Forbidden' });
    }
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ code: 400, msg: 'email と password（8文字以上）が必要です' });
    }
    const db = getFirestore();
    const existing = await db.collection('users').limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ code: 409, msg: 'ユーザーが既に存在します' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const ref = db.collection('users').doc();
    await ref.set({
      email,
      passwordHash,
      role: 'admin',
      orgId: orgId(),
      createdAt: Date.now(),
    });
    res.json({ code: 200, userId: ref.id, email });
  });

  /**
   * bootstrap と同一秘密鍵。ローカル seed 用: 新規 superadmin 作成、または既存ユーザーを superadmin に昇格。
   * 既存ユーザーがいる場合は password 省略可（パスワードは変更しない）。
   */
  app.post('/api/auth/bootstrap-superadmin', async (req, res) => {
    applyCors(res, corsHeaders(req));
    const secret = req.get('X-Bootstrap-Secret');
    if (!secret || secret !== process.env.AUTH_BOOTSTRAP_SECRET) {
      return res.status(403).json({ code: 403, msg: 'Forbidden' });
    }
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email) {
      return res.status(400).json({ code: 400, msg: 'email が必要です' });
    }
    const db = getFirestore();
    const q = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!q.empty) {
      const doc = q.docs[0];
      /** @type {Record<string, unknown>} */
      const updates = { role: 'superadmin', updatedAt: Date.now() };
      if (password.length >= 8) {
        updates.passwordHash = await bcrypt.hash(password, 12);
      }
      await doc.ref.update(updates);
      return res.json({ code: 200, userId: doc.id, email, action: 'promoted' });
    }
    if (password.length < 8) {
      return res.status(400).json({
        code: 400,
        msg: '該当メールのユーザーがいません。新規作成には password（8文字以上）が必要です',
      });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const ref = db.collection('users').doc();
    await ref.set({
      email,
      passwordHash,
      role: 'superadmin',
      orgId: orgId(),
      createdAt: Date.now(),
      createdByBootstrapSuperadmin: true,
    });
    return res.json({ code: 200, userId: ref.id, email, action: 'created' });
  });

  app.get('/api/admin/facilities', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const db = getFirestore();
    const snap = await db
      .collection('facilities')
      .where('orgId', '==', req.user.orgId)
      .get();
    const items = [];
    snap.forEach((doc) => {
      items.push({ facilityId: Number(doc.id), ...doc.data() });
    });
    items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.facilityId - b.facilityId);
    res.json({ code: 200, data: items });
  });

  app.post('/api/admin/facilities', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const { facilityId, name, sortOrder, address, lat, lng } = req.body || {};
    const verr = validateFacilityPayload(facilityId, name, sortOrder, address, lat, lng);
    if (verr) return res.status(400).json({ code: 400, msg: verr });
    const db = getFirestore();
    const ref = db.collection('facilities').doc(String(facilityId));
    const cur = await ref.get();
    if (cur.exists) return res.status(409).json({ code: 409, msg: 'facilityId が既に存在します' });
    await ref.set({
      orgId: req.user.orgId,
      name: String(name).trim(),
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      address: address != null ? String(address).slice(0, 500) : '',
      lat: lat != null && lat !== '' ? Number(lat) : null,
      lng: lng != null && lng !== '' ? Number(lng) : null,
      disabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: req.user.uid,
    });
    await appendDeviceAudit(req.user, 'facility.create', { facilityId: Number(facilityId), name });
    res.json({ code: 200, facilityId: ref.id });
  });

  app.patch('/api/admin/facilities/:facilityId', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const fid = req.params.facilityId;
    const db = getFirestore();
    const ref = db.collection('facilities').doc(String(fid));
    const cur = await ref.get();
    if (!cur.exists || cur.data().orgId !== req.user.orgId) {
      return res.status(404).json({ code: 404, msg: '見つかりません' });
    }
    const patch = {};
    if (req.body.name != null) {
      const n = String(req.body.name).trim();
      if (!n) return res.status(400).json({ code: 400, msg: 'name が空です' });
      if (n.length > 200) return res.status(400).json({ code: 400, msg: '施設名が長すぎます' });
      patch.name = n;
    }
    if (req.body.sortOrder != null) patch.sortOrder = Number(req.body.sortOrder);
    if (req.body.address != null) patch.address = String(req.body.address).slice(0, 500);
    if (req.body.lat !== undefined) patch.lat = req.body.lat === '' || req.body.lat == null ? null : Number(req.body.lat);
    if (req.body.lng !== undefined) patch.lng = req.body.lng === '' || req.body.lng == null ? null : Number(req.body.lng);
    if (req.body.disabled != null) patch.disabled = !!req.body.disabled;
    patch.updatedAt = Date.now();
    await ref.update(patch);
    await appendDeviceAudit(req.user, 'facility.patch', { facilityId: fid, patch });
    res.json({ code: 200 });
  });

  app.delete('/api/admin/facilities/:facilityId', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const fid = req.params.facilityId;
    const db = getFirestore();
    const ref = db.collection('facilities').doc(String(fid));
    const cur = await ref.get();
    if (!cur.exists || cur.data().orgId !== req.user.orgId) {
      return res.status(404).json({ code: 404, msg: '見つかりません' });
    }
    await ref.set({ disabled: true, updatedAt: Date.now() }, { merge: true });
    await appendDeviceAudit(req.user, 'facility.disable', { facilityId: fid });
    res.json({ code: 200 });
  });

  app.get('/api/admin/devices', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const db = getFirestore();
    const snap = await db
      .collection('devices')
      .where('orgId', '==', req.user.orgId)
      .get();
    const items = [];
    snap.forEach((doc) => {
      items.push({ deviceId: doc.id, ...doc.data() });
    });
    res.json({ code: 200, data: items });
  });

  app.post('/api/admin/devices', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const { deviceId, label, facilityId } = req.body || {};
    const err = validateDevicePayload(deviceId, facilityId, label);
    if (err) return res.status(400).json({ code: 400, msg: err });
    const db = getFirestore();
    const facErr = await assertDeviceFacilityAllowed(db, req.user.orgId, facilityId);
    if (facErr) return res.status(400).json({ code: 400, msg: facErr });
    const ref = db.collection('devices').doc(String(deviceId));
    const cur = await ref.get();
    if (cur.exists) return res.status(409).json({ code: 409, msg: 'deviceId が既に存在します' });
    await ref.set({
      orgId: req.user.orgId,
      label: label || '',
      facilityId: Number(facilityId),
      disabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: req.user.uid,
    });
    await appendDeviceAudit(req.user, 'device.create', {
      deviceId: ref.id,
      facilityId: Number(facilityId),
      label: label || '',
    });
    res.json({ code: 200, deviceId: ref.id });
  });

  app.post('/api/admin/devices/bulk', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ code: 400, msg: 'items が必要です' });
    }
    if (items.length > 100) {
      return res.status(400).json({ code: 400, msg: '最大100件までです' });
    }
    const db = getFirestore();
    const oid = req.user.orgId;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const msg = validateDevicePayload(it.deviceId, it.facilityId, it.label);
      if (msg) errors.push({ index: i, msg });
    }
    if (errors.length > 0) {
      return res.status(400).json({ code: 400, msg: '検証エラー', errors });
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const facErr = await assertDeviceFacilityAllowed(db, oid, it.facilityId);
      if (facErr) errors.push({ index: i, msg: facErr });
    }
    if (errors.length > 0) {
      return res.status(400).json({ code: 400, msg: '検証エラー', errors });
    }

    for (const it of items) {
      const ref = db.collection('devices').doc(String(it.deviceId));
      const cur = await ref.get();
      if (cur.exists) {
        return res.status(409).json({ code: 409, msg: `既に存在: ${it.deviceId}` });
      }
    }

    const batch = db.batch();
    const now = Date.now();
    for (const it of items) {
      const ref = db.collection('devices').doc(String(it.deviceId));
      batch.set(ref, {
        orgId: oid,
        label: it.label || '',
        facilityId: Number(it.facilityId),
        disabled: false,
        createdAt: now,
        updatedAt: now,
        createdBy: req.user.uid,
      });
    }
    await batch.commit();
    await appendDeviceAudit(req.user, 'device.bulk_create', {
      count: items.length,
      deviceIds: items.map((it) => String(it.deviceId)),
    });
    res.json({ code: 200, count: items.length });
  });

  app.patch('/api/admin/devices/:deviceId', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const deviceId = req.params.deviceId;
    const db = getFirestore();
    const ref = db.collection('devices').doc(deviceId);
    const cur = await ref.get();
    if (!cur.exists || cur.data().orgId !== req.user.orgId) {
      return res.status(404).json({ code: 404, msg: '見つかりません' });
    }
    const patch = {};
    if (req.body.label != null) patch.label = String(req.body.label).slice(0, 200);
    if (req.body.facilityId != null) {
      const newFid = Number(req.body.facilityId);
      const facErr = await assertDeviceFacilityAllowed(db, req.user.orgId, newFid);
      if (facErr) return res.status(400).json({ code: 400, msg: facErr });
      patch.facilityId = newFid;
    }
    if (req.body.disabled != null) patch.disabled = !!req.body.disabled;
    patch.updatedAt = Date.now();
    await ref.update(patch);
    await appendDeviceAudit(req.user, 'device.patch', { deviceId, patch });
    res.json({ code: 200 });
  });

  app.delete('/api/admin/devices/:deviceId', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const deviceId = req.params.deviceId;
    const db = getFirestore();
    const ref = db.collection('devices').doc(deviceId);
    const cur = await ref.get();
    if (!cur.exists || cur.data().orgId !== req.user.orgId) {
      return res.status(404).json({ code: 404, msg: '見つかりません' });
    }
    await ref.set({ disabled: true, updatedAt: Date.now() }, { merge: true });
    await appendDeviceAudit(req.user, 'device.disable', { deviceId });
    res.json({ code: 200 });
  });

  app.get('/api/admin/org-settings', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const db = getFirestore();
    const snap = await db.collection('orgs').doc(req.user.orgId).get();
    const data = buildAdminOrgSettingsResponse(
      req.user.orgId,
      snap.exists ? snap.data() : undefined,
    );
    res.json({ code: 200, data });
  });

  app.patch('/api/admin/org-settings', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const body = req.body || {};
    const dashboardFields = ['dashboardTitle', 'dashboardSubtitle', 'themePrimary', 'logoUrl'];
    const patch = {};
    let changed = false;

    for (const f of dashboardFields) {
      if (!Object.prototype.hasOwnProperty.call(body, f)) continue;
      const r = validateDashboardPatchField(f, body[f]);
      if (!r.ok) return res.status(400).json({ code: 400, msg: r.msg });
      changed = true;
      if (r.value === '') {
        patch[f] = FieldValue.delete();
      } else {
        patch[f] = r.value;
      }
    }

    const keyPatch = normalizeBuildicsApiKeyPatch(body);
    if (keyPatch.action === 'error') {
      return res.status(400).json({ code: 400, msg: keyPatch.msg });
    }
    if (keyPatch.action === 'clear') {
      patch.buildicsApiKey = FieldValue.delete();
      changed = true;
    } else if (keyPatch.action === 'set') {
      patch.buildicsApiKey = keyPatch.value;
      changed = true;
    }

    if (!changed) {
      return res.json({ code: 200, msg: '変更なし' });
    }

    patch.updatedAt = Date.now();
    const db = getFirestore();
    await db.collection('orgs').doc(req.user.orgId).set(patch, { merge: true });

    const auditKeys = Object.keys(patch).filter((k) => k !== 'updatedAt');
    await appendDeviceAudit(req.user, 'org.settings.patch', {
      keys: auditKeys,
      buildicsApiKeyUpdated: keyPatch.action === 'set' || keyPatch.action === 'clear',
    });
    res.json({ code: 200 });
  });

  app.get('/api/admin/platform/orgs', requireAuth(['superadmin']), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const db = getFirestore();
    const snap = await db.collection('orgs').get();
    const items = [];
    snap.forEach((doc) => {
      items.push(stripOrgForList(doc.id, doc.data()));
    });
    items.sort((a, b) => String(a.orgId).localeCompare(String(b.orgId)));
    res.json({ code: 200, data: items });
  });

  app.post('/api/admin/platform/orgs', requireAuth(['superadmin']), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const { orgId, slug, name } = req.body || {};
    try {
      const db = getFirestore();
      const result = await createOrgDocument(db, { orgId, slug, name });
      await appendDeviceAudit(req.user, 'platform.org.create', {
        orgId: result.orgId,
        slug: result.slug,
      });
      res.json({ code: 200, orgId: result.orgId, slug: result.slug });
    } catch (e) {
      if (e.httpStatus === 400 || e.httpStatus === 409) {
        const key = e.message;
        const msg =
          platformOrgErrorMsg[key] || (e.httpStatus === 409 ? '既に使用されています' : 'リクエストが不正です');
        return res.status(e.httpStatus).json({ code: e.httpStatus, msg });
      }
      throw e;
    }
  });

  app.post('/api/admin/platform/users', requireAuth(['superadmin']), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const targetOrgId = String(req.body?.orgId || '').trim();
    const role = String(req.body?.role || 'admin');
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ code: 400, msg: 'email と password（8文字以上）が必要です' });
    }
    if (!isValidOrgIdForDoc(targetOrgId)) {
      return res.status(400).json({ code: 400, msg: '組織 ID が不正です' });
    }
    if (role !== 'admin' && role !== 'viewer') {
      return res.status(400).json({ code: 400, msg: 'role は admin または viewer です' });
    }
    const db = getFirestore();
    const orgSnap = await db.collection('orgs').doc(targetOrgId).get();
    if (!orgSnap.exists) {
      return res.status(400).json({ code: 400, msg: '組織が存在しません。先に組織を作成してください' });
    }
    const dup = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!dup.empty) {
      return res.status(409).json({ code: 409, msg: 'このメールは既に登録されています' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const ref = db.collection('users').doc();
    await ref.set({
      email,
      passwordHash,
      role,
      orgId: targetOrgId,
      createdAt: Date.now(),
      createdByPlatformAdmin: req.user.uid,
    });
    await appendDeviceAudit(req.user, 'platform.user.create', {
      userId: ref.id,
      email,
      orgId: targetOrgId,
      role,
    });
    res.json({ code: 200, userId: ref.id });
  });

  app.post('/api/buildics', async (req, res) => {
    applyCors(res, corsHeaders(req));
    const upstreamPath = req.query.path;
    if (!upstreamPath || !ALLOWED_PATHS.has(upstreamPath)) {
      return res.status(400).json({ code: 400, msg: '許可されていないエンドポイントです' });
    }

    const deviceIds = extractDeviceIdsFromBuildicsBody(req.body);
    let ledgerOrgId;
    try {
      const db = getFirestore();
      const resolved = await resolvePublicOrg(db, req.query.orgSlug);
      ledgerOrgId = resolved.orgId;
    } catch (e) {
      if (e.httpStatus === 404) {
        return res.status(404).json({ code: 404, msg: '組織が見つかりません' });
      }
      throw e;
    }
    try {
      await assertDevicesInLedger(deviceIds, ledgerOrgId);
    } catch (e) {
      if (e.code === 403) {
        return res.status(403).json({ code: 403, msg: 'デバイスが台帳に登録されていません' });
      }
      throw e;
    }

    try {
      const db = getFirestore();
      const apiKey = await getBuildicsApiKeyForLedger(db, ledgerOrgId);
      if (!apiKey) {
        return res.status(500).json({ code: 500, msg: 'BUILDICS API が未設定です' });
      }
      const upstream = await fetch(`${BUILDICS_API_BASE}${upstreamPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          Apikey: apiKey,
          'X-Apikey-Encoding': 'base64',
        },
        body: JSON.stringify(req.body),
      });

      if (!upstream.ok) {
        return res.status(upstream.status).json({ code: upstream.status, msg: upstream.statusText });
      }

      const data = await upstream.json();
      res.json(data);
    } catch (err) {
      console.error('BUILDICS proxy error:', err);
      res.status(500).json({ code: 500, msg: '上流APIへの接続に失敗しました' });
    }
  });

  app.use((req, res) => {
    applyCors(res, corsHeaders(req));
    res.status(404).json({ code: 404, msg: 'Not Found' });
  });

  return app;
}

module.exports = { createApiApp, ALLOWED_PATHS, MAX_BODY_JSON };
