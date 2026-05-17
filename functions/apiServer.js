'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const defaultPublicConfig = require('./defaults/publicConfig.json');
const {
  ALLOWED_PATHS,
  MAX_BODY_JSON,
  validateDevicePayload,
  extractDeviceIdsFromBuildicsBody,
} = require('./lib/buildicsProxyRules');
const { validateFacilityPayload } = require('./lib/facilityValidation');
const { facilityCreateConflictMessage } = require('./lib/facilityDuplicateMsg');
const {
  toStoredFacilityPlacementType,
  validateFacilityPlacementTypeInput,
} = require('./lib/facilityPlacementType');
const {
  toStoredFacilityVenueCategory,
  validateFacilityVenueCategoryInput,
} = require('./lib/facilityVenueCategory');
const { normalizeAuthBootstrapSecret } = require('./lib/bootstrapSecretNormalize');
const { resolvePublicOrg, getOrgSlugForOrgId } = require('./lib/orgResolve');
const {
  normalizeOrgIds,
  assertOrgIdsValid,
  userMayAccessOrg,
  syncPrimaryOrgWithList,
} = require('./lib/userOrgScope');
const {
  createOrgDocument,
  stripOrgForList,
  ERROR_MSG_JA: platformOrgErrorMsg,
  isValidOrgIdForDoc,
} = require('./lib/platformOrg');
const { stripUserForPlatformList, countSuperadmins } = require('./lib/platformUserAdmin');
const {
  mergeOrgDashboardIntoConfig,
  buildAdminOrgSettingsResponse,
  validateDashboardPatchField,
  normalizeBuildicsApiKeyPatch,
  getBuildicsApiKeyForLedger,
} = require('./lib/orgDashboardMerge');
const { uploadOrgLogoBuffer, deleteManagedOrgLogoObject } = require('./lib/orgLogoStorage');
const {
  uploadFacilityInstallationPhotoBuffer,
  deleteManagedFacilityInstallationPhoto,
} = require('./lib/facilityPhotoStorage');
const { geocodeAddressWithGsi } = require('./lib/gsiGeocode');
const { signAccess, signRefresh, verifyAccess, verifyRefresh } = require('./lib/jwtEnv');
const jwaWbgt = require('./lib/jwaWbgtClient');
const jmaHeatAdvisory = require('./lib/jmaHeatAdvisoryClient');
const { fetchLocationConditions } = require('./lib/locationConditions');

const BUILDICS_API_BASE = 'https://www.buildics.jp/api';

/** Firebase Storage の設置写真 URL のみ公開設定へ載せる（任意 URL の混入を防止） */
function publicInstallationPhotoUrl(data) {
  const u =
    typeof data.installationPhotoUrl === 'string' ? data.installationPhotoUrl.trim().slice(0, 2048) : '';
  if (!u) return null;
  try {
    const x = new URL(u);
    if (x.protocol !== 'https:' || x.hostname !== 'firebasestorage.googleapis.com') return null;
    return u;
  } catch {
    return null;
  }
}

function facilityToMockCard(id, data) {
  const name = (data.name || `施設 ${id}`).trim();
  const pic = publicInstallationPhotoUrl(data);
  /** @type {Record<string, unknown>} */
  const card = {
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
    placementType: toStoredFacilityPlacementType(data.placementType),
    venueCategory: toStoredFacilityVenueCategory(data.venueCategory),
    ...(data.address ? { address: String(data.address).slice(0, 500) } : {}),
    ...(Number.isFinite(Number(data.lat)) ? { lat: Number(data.lat) } : {}),
    ...(Number.isFinite(Number(data.lng)) ? { lng: Number(data.lng) } : {}),
    ...(pic ? { installationPhotoUrl: pic } : {}),
  };
  return card;
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

function isJwtConfigError(err) {
  const m = err && err.message ? String(err.message) : '';
  return m.includes('JWT') || m.includes('secret not configured');
}

function orgId() {
  return process.env.DEFAULT_ORG_ID || 'default';
}

/** ヘッダと環境変数の前後空白・BOM・誤貼り付けを無視して比較 */
function verifyBootstrapSecret(req) {
  const got = normalizeAuthBootstrapSecret(req.get('X-Bootstrap-Secret'));
  const expected = normalizeAuthBootstrapSecret(process.env.AUTH_BOOTSTRAP_SECRET);
  return Boolean(got && expected && got === expected);
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

/**
 * ログイン／refresh／switch-org で返すユーザー JSON（シークレットなし）
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} userId
 * @param {FirebaseFirestore.DocumentData | undefined} u
 */
async function buildAdminAuthUserResponse(db, userId, u) {
  const normalizedList = normalizeOrgIds(u);
  const { orgId: primaryOid, orgIds } = syncPrimaryOrgWithList(
    normalizedList,
    String(u.orgId || '').trim() || undefined,
  );
  const orgSlug = await getOrgSlugForOrgId(db, primaryOid);
  const orgs = await Promise.all(
    orgIds.map(async (oid) => ({
      orgId: oid,
      orgSlug: await getOrgSlugForOrgId(db, oid),
    })),
  );
  return {
    id: userId,
    email: u.email != null ? String(u.email) : '',
    role: u.role != null ? String(u.role) : 'viewer',
    orgId: primaryOid,
    orgSlug,
    orgIds,
    orgs,
  };
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

  const orgLogoRawBody = express.raw({
    type: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
    limit: '2mb',
  });

  const facilityPhotoRawBody = express.raw({
    type: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    limit: '5mb',
  });

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

  /** 日本気象協会（JWA）WBGT API 連携可否（キー設定の有無のみ） */
  app.get('/api/public/jwa-wbgt/status', async (req, res) => {
    applyCors(res, corsHeaders(req));
    res.json({ configured: jwaWbgt.isJwaConfigured() });
  });

  /**
   * JWA 1km メッシュ WBGT 予測（時別）。緯度・経度は施設マスタ等と突合。
   * @query lat, lon（または lng）
   */
  app.get('/api/public/jwa-wbgt/forecasts/hourly', async (req, res) => {
    applyCors(res, corsHeaders(req));
    if (!jwaWbgt.isJwaConfigured()) {
      return res.status(503).json({
        code: 503,
        msg: '日本気象協会 WBGT API が未設定です（JWA_X_API_KEY / JWA_APIKEY）',
        configured: false,
      });
    }
    const ll = jwaWbgt.parseLatLonQuery(req.query);
    if (!ll) {
      return res.status(400).json({ code: 400, msg: 'lat と lon（または lng）を数値で指定してください' });
    }
    try {
      const payload = await jwaWbgt.fetchHourlyForecastByPoint(ll.lat, ll.lng);
      if (payload && payload.error) {
        console.error('jwa hourly normalize', payload);
        return res.status(502).json({ code: 502, msg: payload.message || 'JWA 応答の解釈に失敗しました' });
      }
      return res.json({
        source: 'jwa',
        kind: 'forecasts/hourly',
        attribution: '日本気象協会（JWA）WBGT API・1km メッシュ予測（参考）',
        point: { lat: ll.lat, lon: ll.lng },
        ...payload,
      });
    } catch (e) {
      if (e && e.code === 'not_configured') {
        return res.status(503).json({ code: 503, msg: e.message, configured: false });
      }
      console.error('jwa hourly', e && e.message, e && e.bodySnippet);
      const status = e && e.status === 401 ? 502 : 502;
      return res.status(status).json({
        code: status,
        msg: e && e.message ? String(e.message) : 'JWA API の取得に失敗しました',
      });
    }
  });

  /**
   * JWA 1km メッシュ WBGT 予測（日別・最大8日）
   */
  app.get('/api/public/jwa-wbgt/forecasts/daily', async (req, res) => {
    applyCors(res, corsHeaders(req));
    if (!jwaWbgt.isJwaConfigured()) {
      return res.status(503).json({
        code: 503,
        msg: '日本気象協会 WBGT API が未設定です（JWA_X_API_KEY / JWA_APIKEY）',
        configured: false,
      });
    }
    const ll = jwaWbgt.parseLatLonQuery(req.query);
    if (!ll) {
      return res.status(400).json({ code: 400, msg: 'lat と lon（または lng）を数値で指定してください' });
    }
    try {
      const payload = await jwaWbgt.fetchDailyForecastByPoint(ll.lat, ll.lng);
      if (payload && payload.error) {
        console.error('jwa daily normalize', payload);
        return res.status(502).json({ code: 502, msg: payload.message || 'JWA 応答の解釈に失敗しました' });
      }
      return res.json({
        source: 'jwa',
        kind: 'forecasts/daily',
        attribution: '日本気象協会（JWA）WBGT API・1km メッシュ予測（参考）',
        point: { lat: ll.lat, lon: ll.lng },
        ...payload,
      });
    } catch (e) {
      if (e && e.code === 'not_configured') {
        return res.status(503).json({ code: 503, msg: e.message, configured: false });
      }
      console.error('jwa daily', e && e.message, e && e.bodySnippet);
      return res.status(502).json({
        code: 502,
        msg: e && e.message ? String(e.message) : 'JWA API の取得に失敗しました',
      });
    }
  });

  /**
   * ダッシュボード用: 複数地点の JWA 時別予測を一括取得（地点ごとに JWA API を呼び出し）
   */
  app.post('/api/public/jwa-wbgt/forecasts/hourly/batch', async (req, res) => {
    applyCors(res, corsHeaders(req));
    if (!jwaWbgt.isJwaConfigured()) {
      return res.status(503).json({
        code: 503,
        msg: '日本気象協会 WBGT API が未設定です（JWA_X_API_KEY / JWA_APIKEY）',
        configured: false,
      });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const raw = body.facilities;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ code: 400, msg: 'facilities は1件以上の配列で指定してください' });
    }
    if (raw.length > jwaWbgt.JWA_BATCH_MAX) {
      return res.status(400).json({
        code: 400,
        msg: `facilities は${jwaWbgt.JWA_BATCH_MAX}件までです`,
      });
    }
    const items = [];
    for (const row of raw) {
      const id = row.id != null ? row.id : row.facilityId;
      if (id == null || id === '') continue;
      const ll = jwaWbgt.parseLatLonQuery({
        lat: row.lat,
        lon: row.lon != null ? row.lon : row.lng,
      });
      if (ll) items.push({ id, lat: ll.lat, lng: ll.lng });
    }
    if (items.length === 0) {
      return res.status(400).json({
        code: 400,
        msg: '有効な id・lat・lng（または lon）を含む施設がありません',
      });
    }
    try {
      const results = await jwaWbgt.fetchHourlyForecastBatch(items);
      return res.json({
        source: 'jwa',
        kind: 'forecasts/hourly/batch',
        attribution: '日本気象協会（JWA）WBGT API・1km メッシュ予測（参考）',
        results,
      });
    } catch (e) {
      if (e && e.code === 'not_configured') {
        return res.status(503).json({ code: 503, msg: e.message, configured: false });
      }
      console.error('jwa hourly batch', e && e.message);
      return res.status(502).json({
        code: 502,
        msg: e && e.message ? String(e.message) : 'JWA API の一括取得に失敗しました',
      });
    }
  });

  /**
   * 気象庁「熱中症警戒アラート」（VPFT50）の有無・参考文面。
   * 緯度経度は国土地理院逆ジオで都道府県を特定（日本国内想定）。
   */
  app.get('/api/public/jma-wbgt/advisory', async (req, res) => {
    applyCors(res, corsHeaders(req));
    const ll = jmaHeatAdvisory.parseLatLonQuery(req.query);
    if (!ll) {
      return res.status(400).json({ code: 400, msg: 'lat と lon（または lng）を数値で指定してください' });
    }
    try {
      const payload = await jmaHeatAdvisory.fetchHeatAdvisoryForPoint(ll.lat, ll.lng);
      return res.json({
        source: 'jma',
        kind: 'heat_stroke_advisory',
        attribution: '気象庁 防災情報 XML（熱中症警戒アラート・VPFT50／参考）',
        point: { lat: ll.lat, lon: ll.lng },
        ...payload,
      });
    } catch (e) {
      if (e && e.code === 'geocode_failed') {
        return res.status(422).json({
          code: 422,
          msg: e.message || '位置から都道府県を判定できませんでした',
        });
      }
      if (e && e.code === 'feed_failed') {
        console.error('jma heat advisory feed', e && e.message);
        return res.status(502).json({
          code: 502,
          msg: e.message || '気象庁フィードの取得に失敗しました',
        });
      }
      console.error('jma heat advisory', e && e.message);
      return res.status(502).json({
        code: 502,
        msg: e && e.message ? String(e.message) : '気象庁参照情報の取得に失敗しました',
      });
    }
  });

  /**
   * ダッシュボード用: 複数施設の気象庁熱中症警戒アラートを一括照会（Atom フィードは1回）
   */
  app.post('/api/public/jma-wbgt/advisory/batch', async (req, res) => {
    applyCors(res, corsHeaders(req));
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const raw = body.facilities;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ code: 400, msg: 'facilities は1件以上の配列で指定してください' });
    }
    if (raw.length > jmaHeatAdvisory.BATCH_MAX) {
      return res.status(400).json({
        code: 400,
        msg: `facilities は${jmaHeatAdvisory.BATCH_MAX}件までです`,
      });
    }
    const items = [];
    for (const row of raw) {
      const id = row.id != null ? row.id : row.facilityId;
      if (id == null || id === '') continue;
      const lat = Number(row.lat);
      const lng = Number(row.lon != null ? row.lon : row.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      items.push({ id, lat, lng });
    }
    if (items.length === 0) {
      return res.status(400).json({
        code: 400,
        msg: '有効な id・lat・lng（または lon）を含む施設がありません',
      });
    }
    try {
      const results = await jmaHeatAdvisory.fetchHeatAdvisoryBatch(items);
      return res.json({
        source: 'jma',
        kind: 'heat_stroke_advisory/batch',
        attribution: '気象庁 防災情報 XML（熱中症警戒アラート・VPFT50／参考）',
        results,
      });
    } catch (e) {
      if (e && e.code === 'feed_failed') {
        console.error('jma heat advisory batch feed', e && e.message);
        return res.status(502).json({
          code: 502,
          msg: e.message || '気象庁フィードの取得に失敗しました',
        });
      }
      console.error('jma heat advisory batch', e && e.message);
      return res.status(502).json({
        code: 502,
        msg: e && e.message ? String(e.message) : '気象庁参照情報の一括取得に失敗しました',
      });
    }
  });

  /**
   * @param {string | string[] | null | undefined} requiredRole
   * - `admin`: `admin` と `superadmin` を許可（通常の管理 API）
   * - `['superadmin']`: プラットフォーム API（配列時は完全一致）
   * - `['admin','viewer','superadmin']` など: 列挙ロールのみ（例: 組織切替）
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
    try {
      const db = getFirestore();
      const q = await db.collection('users').where('email', '==', email).limit(1).get();
      if (q.empty) {
        return res.status(401).json({ code: 401, msg: '認証に失敗しました' });
      }
      const doc = q.docs[0];
      const u = doc.data();
      const ok = await bcrypt.compare(password, u.passwordHash || '');
      if (!ok) return res.status(401).json({ code: 401, msg: '認証に失敗しました' });

      const { orgId: jwtOrgId } = syncPrimaryOrgWithList(
        normalizeOrgIds(u),
        String(u.orgId || '').trim() || undefined,
      );
      const payload = { sub: doc.id, role: u.role || 'viewer', orgId: jwtOrgId };
      const accessToken = signAccess(payload);
      const refreshToken = signRefresh({ sub: doc.id });
      const userJson = await buildAdminAuthUserResponse(db, doc.id, u);
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
        user: userJson,
      });
    } catch (e) {
      if (isJwtConfigError(e)) {
        console.warn('auth login: JWT secrets not configured (set JWT_* or run Firebase emulators)');
        return res.status(503).json({
          code: 503,
          msg:
            '認証トークンの設定が不完全です。functions/.env に JWT_ACCESS_SECRET と JWT_REFRESH_SECRET（または JWT_SECRET）を設定してください。',
        });
      }
      console.error('auth login', e);
      return res.status(500).json({ code: 500, msg: 'ログイン処理に失敗しました。しばらくしてからお試しください。' });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    applyCors(res, corsHeaders(req));
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ code: 401, msg: 'Refresh がありません' });
    let d;
    try {
      d = verifyRefresh(token);
    } catch {
      return res.status(401).json({ code: 401, msg: 'Refresh が無効です' });
    }
    try {
      const db = getFirestore();
      const doc = await db.collection('users').doc(d.sub).get();
      if (!doc.exists) return res.status(401).json({ code: 401, msg: 'ユーザーが見つかりません' });
      const u = doc.data();
      const { orgId: jwtOrgId } = syncPrimaryOrgWithList(
        normalizeOrgIds(u),
        String(u.orgId || '').trim() || undefined,
      );
      const payload = { sub: doc.id, role: u.role || 'viewer', orgId: jwtOrgId };
      const accessToken = signAccess(payload);
      const userJson = await buildAdminAuthUserResponse(db, doc.id, u);
      res.json({ code: 200, accessToken, user: userJson });
    } catch (e) {
      if (isJwtConfigError(e)) {
        console.warn('auth refresh: JWT secrets not configured');
        return res.status(503).json({
          code: 503,
          msg:
            '認証トークンの設定が不完全です。functions/.env に JWT_ACCESS_SECRET と JWT_REFRESH_SECRET（または JWT_SECRET）を設定してください。',
        });
      }
      console.error('auth refresh', e);
      return res.status(500).json({ code: 500, msg: 'トークンの再発行に失敗しました。' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    applyCors(res, corsHeaders(req));
    res.clearCookie('refresh_token', { path: '/' });
    res.json({ code: 200, msg: 'ok' });
  });

  /** admin / viewer / superadmin: 操作中の組織を切り替え、新しい accessToken を返す */
  app.post('/api/auth/switch-org', requireAuth(['admin', 'viewer', 'superadmin']), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const targetOrgId = String(req.body?.orgId || '').trim();
    if (!targetOrgId) {
      return res.status(400).json({ code: 400, msg: 'orgId が必要です' });
    }
    try {
      const db = getFirestore();
      const ref = db.collection('users').doc(req.user.uid);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(401).json({ code: 401, msg: 'ユーザーが見つかりません' });
      }
      const u = snap.data();
      const isSuper = u.role === 'superadmin';
      if (isSuper) {
        const os = await db.collection('orgs').doc(targetOrgId).get();
        if (!os.exists) {
          return res.status(403).json({ code: 403, msg: '組織にアクセスできません' });
        }
      } else if (!userMayAccessOrg(u, targetOrgId, { isSuperadmin: false })) {
        return res.status(403).json({ code: 403, msg: '組織にアクセスできません' });
      }
      const normalized = normalizeOrgIds(u);
      const newOrgIds = normalized.includes(targetOrgId)
        ? [targetOrgId, ...normalized.filter((oid) => oid !== targetOrgId)]
        : [targetOrgId, ...normalized];
      await ref.update({
        orgId: targetOrgId,
        orgIds: newOrgIds,
        updatedAt: Date.now(),
      });
      const fresh = await ref.get();
      const u2 = fresh.data();
      const { orgId: jwtOrgId } = syncPrimaryOrgWithList(
        normalizeOrgIds(u2),
        String(u2.orgId || '').trim() || undefined,
      );
      const payload = { sub: fresh.id, role: u2.role || 'viewer', orgId: jwtOrgId };
      const accessToken = signAccess(payload);
      const userJson = await buildAdminAuthUserResponse(db, fresh.id, u2);
      res.json({ code: 200, accessToken, user: userJson });
    } catch (e) {
      if (isJwtConfigError(e)) {
        console.warn('switch-org: JWT secrets not configured');
        return res.status(503).json({
          code: 503,
          msg:
            '認証トークンの設定が不完全です。functions/.env に JWT_ACCESS_SECRET と JWT_REFRESH_SECRET（または JWT_SECRET）を設定してください。',
        });
      }
      console.error('switch-org', e);
      return res.status(500).json({ code: 500, msg: '組織の切り替えに失敗しました。しばらくしてからお試しください。' });
    }
  });

  app.post('/api/auth/bootstrap', async (req, res) => {
    applyCors(res, corsHeaders(req));
    if (!verifyBootstrapSecret(req)) {
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
    const oidBootstrap = orgId();
    await ref.set({
      email,
      passwordHash,
      /** 初回1人のみ: プラットフォーム兼用の superadmin（組織の admin は後からプラットフォーム画面で追加） */
      role: 'superadmin',
      orgId: oidBootstrap,
      orgIds: [oidBootstrap],
      createdAt: Date.now(),
      createdByBootstrap: true,
    });
    res.json({ code: 200, userId: ref.id, email, role: 'superadmin' });
  });

  /**
   * bootstrap と同一秘密鍵。ローカル seed 用: 新規 superadmin 作成、または既存ユーザーを superadmin に昇格。
   * 既存ユーザーがいる場合は password 省略可（パスワードは変更しない）。
   */
  app.post('/api/auth/bootstrap-superadmin', async (req, res) => {
    applyCors(res, corsHeaders(req));
    if (!verifyBootstrapSecret(req)) {
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
    const oidNew = orgId();
    await ref.set({
      email,
      passwordHash,
      role: 'superadmin',
      orgId: oidNew,
      orgIds: [oidNew],
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

  app.get('/api/admin/geocode', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const q = String(req.query.q || '').trim();
    const result = await geocodeAddressWithGsi(q);
    if (!result.ok) {
      let status = 502;
      if (result.msg.includes('文字以上') || result.msg.includes('文字以内')) status = 400;
      else if (result.msg.includes('該当する位置が見つかりません')) status = 404;
      return res.status(status).json({ code: status, msg: result.msg });
    }
    const body = { code: 200, lat: result.lat, lng: result.lng };
    if (result.label) body.label = result.label;
    res.json(body);
  });

  app.get('/api/admin/location-conditions', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const ll = jwaWbgt.parseLatLonQuery(req.query);
    if (!ll) {
      return res.status(400).json({ code: 400, msg: 'lat と lon（または lng）を数値で指定してください' });
    }
    try {
      const data = await fetchLocationConditions({ lat: ll.lat, lng: ll.lng, jwaWbgt });
      return res.json({ code: 200, ...data });
    } catch (e) {
      console.error('location-conditions', e && e.message);
      const msg =
        e && (e.code === 'open_meteo_http' || e.code === 'open_meteo_parse' || e.code === 'open_meteo_network')
          ? String(e.message)
          : '付近の気象情報の取得に失敗しました';
      return res.status(502).json({ code: 502, msg });
    }
  });

  app.post('/api/admin/facilities', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const { facilityId, name, sortOrder, address, lat, lng, placementType, venueCategory } = req.body || {};
    const verr = validateFacilityPayload(
      facilityId,
      name,
      sortOrder,
      address,
      lat,
      lng,
      placementType,
      venueCategory,
    );
    if (verr) return res.status(400).json({ code: 400, msg: verr });
    const db = getFirestore();
    const ref = db.collection('facilities').doc(String(facilityId));
    const cur = await ref.get();
    if (cur.exists) {
      const prevOrg = cur.data()?.orgId;
      return res.status(409).json({
        code: 409,
        msg: facilityCreateConflictMessage(prevOrg, req.user.orgId),
      });
    }
    await ref.set({
      orgId: req.user.orgId,
      name: String(name).trim(),
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      address: address != null ? String(address).slice(0, 500) : '',
      lat: lat != null && lat !== '' ? Number(lat) : null,
      lng: lng != null && lng !== '' ? Number(lng) : null,
      placementType: toStoredFacilityPlacementType(placementType),
      venueCategory: toStoredFacilityVenueCategory(venueCategory),
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
    if (req.body.placementType !== undefined) {
      const pErr = validateFacilityPlacementTypeInput(req.body.placementType);
      if (pErr) return res.status(400).json({ code: 400, msg: pErr });
      patch.placementType = toStoredFacilityPlacementType(req.body.placementType);
    }
    if (req.body.venueCategory !== undefined) {
      const cErr = validateFacilityVenueCategoryInput(req.body.venueCategory);
      if (cErr) return res.status(400).json({ code: 400, msg: cErr });
      patch.venueCategory = toStoredFacilityVenueCategory(req.body.venueCategory);
    }
    patch.updatedAt = Date.now();
    await ref.update(patch);
    await appendDeviceAudit(req.user, 'facility.patch', { facilityId: fid, patch });
    res.json({ code: 200 });
  });

  app.post(
    '/api/admin/facilities/:facilityId/photo',
    requireAuth('admin'),
    facilityPhotoRawBody,
    async (req, res) => {
      applyCors(res, corsHeaders(req));
      const fid = String(req.params.facilityId || '').trim();
      try {
        const buf = req.body;
        if (!Buffer.isBuffer(buf) || buf.length === 0) {
          return res.status(400).json({ code: 400, msg: '画像ファイルを送信してください' });
        }
        const ct = String(req.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
        const db = getFirestore();
        const ref = db.collection('facilities').doc(fid);
        const cur = await ref.get();
        if (!cur.exists || cur.data().orgId !== req.user.orgId) {
          return res.status(404).json({ code: 404, msg: '見つかりません' });
        }
        const prev =
          cur.data().installationPhotoUrl != null ? String(cur.data().installationPhotoUrl).trim() : '';
        const { installationPhotoUrl } = await uploadFacilityInstallationPhotoBuffer(
          req.user.orgId,
          fid,
          buf,
          ct,
        );
        await ref.update({ installationPhotoUrl, updatedAt: Date.now() });
        if (prev && prev !== installationPhotoUrl) {
          await deleteManagedFacilityInstallationPhoto(req.user.orgId, fid, prev);
        }
        await appendDeviceAudit(req.user, 'facility.photo.upload', { facilityId: fid });
        res.json({ code: 200, data: { installationPhotoUrl } });
      } catch (e) {
        console.error('facility photo upload', e && e.message, e && e.code, e);
        if (e.code === 'PHOTO_TOO_LARGE') {
          return res.status(400).json({ code: 400, msg: '画像は 5MB 以下にしてください' });
        }
        if (e.code === 'PHOTO_TYPE' || e.code === 'PHOTO_EMPTY') {
          return res.status(400).json({ code: 400, msg: 'PNG / JPEG / WebP の画像を指定してください' });
        }
        if (e.code === 'ADMIN_INIT') {
          return res.status(503).json({
            code: 503,
            msg: 'サーバー初期化エラーです。しばらくしてから再度お試しください。',
          });
        }
        const msg = e && e.message ? String(e.message) : '';
        if (
          e.code === 404 ||
          /bucket not found|Not Found|does not exist|Default Firebase app|storage\/object-not-found/i.test(msg)
        ) {
          return res.status(503).json({
            code: 503,
            msg:
              'Firebase Storage を利用できません。Firebase コンソールで Storage を有効化するか、ローカルなら Storage エミュレータ（firebase emulators:start に storage を含める）を起動してください。',
          });
        }
        res.status(500).json({
          code: 500,
          msg: '設置写真のアップロードに失敗しました。ネットワークと Storage の設定を確認してください。',
        });
      }
    },
  );

  app.delete('/api/admin/facilities/:facilityId/photo', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const fid = String(req.params.facilityId || '').trim();
    const db = getFirestore();
    const ref = db.collection('facilities').doc(fid);
    const cur = await ref.get();
    if (!cur.exists || cur.data().orgId !== req.user.orgId) {
      return res.status(404).json({ code: 404, msg: '見つかりません' });
    }
    const prev =
      cur.data().installationPhotoUrl != null ? String(cur.data().installationPhotoUrl).trim() : '';
    await ref.update({ installationPhotoUrl: FieldValue.delete(), updatedAt: Date.now() });
    if (prev) await deleteManagedFacilityInstallationPhoto(req.user.orgId, fid, prev);
    await appendDeviceAudit(req.user, 'facility.photo.delete', { facilityId: fid });
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

  app.post('/api/admin/org-logo', requireAuth('admin'), orgLogoRawBody, async (req, res) => {
    applyCors(res, corsHeaders(req));
    try {
      const buf = req.body;
      if (!Buffer.isBuffer(buf) || buf.length === 0) {
        return res.status(400).json({ code: 400, msg: '画像ファイルを送信してください' });
      }
      const ct = String(req.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
      const db = getFirestore();
      const orgRef = db.collection('orgs').doc(req.user.orgId);
      const prevSnap = await orgRef.get();
      const prevLogo =
        prevSnap.exists && prevSnap.data().logoUrl != null
          ? String(prevSnap.data().logoUrl).trim()
          : '';
      const { logoUrl } = await uploadOrgLogoBuffer(req.user.orgId, buf, ct);
      await orgRef.set({ logoUrl, updatedAt: Date.now() }, { merge: true });
      if (prevLogo && prevLogo !== logoUrl) {
        await deleteManagedOrgLogoObject(req.user.orgId, prevLogo);
      }
      await appendDeviceAudit(req.user, 'org.logo.upload', {});
      res.json({ code: 200, data: { logoUrl } });
    } catch (e) {
      console.error('org logo upload', e && e.message, e && e.code, e);
      if (e.code === 'LOGO_TOO_LARGE') {
        return res.status(400).json({ code: 400, msg: '画像は 2MB 以下にしてください' });
      }
      if (e.code === 'LOGO_TYPE' || e.code === 'LOGO_EMPTY') {
        return res.status(400).json({ code: 400, msg: 'PNG / JPEG / WebP / SVG の画像を指定してください' });
      }
      if (e.code === 'ADMIN_INIT') {
        return res.status(503).json({
          code: 503,
          msg: 'サーバー初期化エラーです。しばらくしてから再度お試しください。',
        });
      }
      if (e.code === 'LOGO_PUBLIC') {
        return res.status(503).json({
          code: 503,
          msg: 'ストレージの公開設定で失敗しました。Firebase Storage のバケット権限を確認してください。',
        });
      }
      const msg = e && e.message ? String(e.message) : '';
      if (
        e.code === 404 ||
        /bucket not found|Not Found|does not exist|Default Firebase app|storage\/object-not-found/i.test(msg)
      ) {
        return res.status(503).json({
          code: 503,
          msg:
            'Firebase Storage を利用できません。Firebase コンソールで Storage を有効化するか、ローカルなら Storage エミュレータ（firebase emulators:start --only functions,firestore,storage）を起動してください。',
        });
      }
      res.status(500).json({
        code: 500,
        msg: 'ロゴのアップロードに失敗しました。ネットワークと Storage の設定を確認してください。',
      });
    }
  });

  app.patch('/api/admin/org-settings', requireAuth('admin'), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const body = req.body || {};
    const db = getFirestore();
    const orgRef = db.collection('orgs').doc(req.user.orgId);

    /** @type {string | null} */
    let previousLogoUrl = null;
    if (Object.prototype.hasOwnProperty.call(body, 'logoUrl')) {
      const ps = await orgRef.get();
      previousLogoUrl =
        ps.exists && ps.data().logoUrl != null ? String(ps.data().logoUrl).trim() : '';
    }

    const dashboardFields = [
      'dashboardTitle',
      'dashboardSubtitle',
      'themePrimary',
      'logoUrl',
      'pollingIntervalMs',
    ];
    const patch = {};
    let changed = false;
    /** @type {string | null | undefined} */
    let newLogoValidated = undefined;

    for (const f of dashboardFields) {
      if (!Object.prototype.hasOwnProperty.call(body, f)) continue;
      const r = validateDashboardPatchField(f, body[f]);
      if (!r.ok) return res.status(400).json({ code: 400, msg: r.msg });
      changed = true;
      if (f === 'logoUrl') {
        newLogoValidated = r.value === '' ? null : r.value;
      }
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
    await orgRef.set(patch, { merge: true });

    if (
      Object.prototype.hasOwnProperty.call(body, 'logoUrl') &&
      previousLogoUrl &&
      (newLogoValidated === null || newLogoValidated !== previousLogoUrl)
    ) {
      await deleteManagedOrgLogoObject(req.user.orgId, previousLogoUrl);
    }

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
    const targetOrgId = String(req.body?.orgId || '')
      .trim()
      .toLowerCase();
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
      orgIds: [targetOrgId],
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

  app.get('/api/admin/platform/users', requireAuth(['superadmin']), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const db = getFirestore();
    const snap = await db.collection('users').get();
    const items = [];
    snap.forEach((doc) => {
      items.push(stripUserForPlatformList(doc.id, doc.data()));
    });
    items.sort((a, b) => {
      const byOrg = String(a.orgId).localeCompare(String(b.orgId));
      if (byOrg !== 0) return byOrg;
      return String(a.email).localeCompare(String(b.email));
    });
    res.json({ code: 200, data: items });
  });

  app.patch('/api/admin/platform/users/:userId', requireAuth(['superadmin']), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const userId = String(req.params.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ code: 400, msg: 'ユーザー ID が不正です' });
    }
    const body = req.body || {};
    const db = getFirestore();
    const ref = db.collection('users').doc(userId);
    const cur = await ref.get();
    if (!cur.exists) {
      return res.status(404).json({ code: 404, msg: 'ユーザーが見つかりません' });
    }
    const curData = cur.data() || {};
    const isSuper = curData.role === 'superadmin';
    /** @type {Record<string, unknown>} */
    const updates = { updatedAt: Date.now() };
    let changed = false;

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !emailRe.test(email)) {
        return res.status(400).json({ code: 400, msg: 'メールアドレスが不正です' });
      }
      const dup = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!dup.empty && dup.docs[0].id !== userId) {
        return res.status(409).json({ code: 409, msg: 'このメールは既に登録されています' });
      }
      updates.email = email;
      changed = true;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'password') && String(body.password || '').length > 0) {
      const password = String(body.password);
      if (password.length < 8) {
        return res.status(400).json({ code: 400, msg: 'パスワードは8文字以上にしてください' });
      }
      updates.passwordHash = await bcrypt.hash(password, 12);
      changed = true;
    }

    if (!isSuper) {
      if (Object.prototype.hasOwnProperty.call(body, 'role')) {
        const role = String(body.role || '').trim();
        if (role !== 'admin' && role !== 'viewer') {
          return res.status(400).json({ code: 400, msg: 'role は admin または viewer です' });
        }
        updates.role = role;
        changed = true;
      }

      const hasOrgIds = Object.prototype.hasOwnProperty.call(body, 'orgIds');
      const hasOrgId = Object.prototype.hasOwnProperty.call(body, 'orgId');

      if (hasOrgIds || hasOrgId) {
        /** @type {string[] | null} */
        let nextOrgIdsExplicit = null;
        /** @type {string | null} */
        let nextOrgIdExplicit = null;

        if (hasOrgId) {
          const targetOrgId = String(body.orgId || '')
            .trim()
            .toLowerCase();
          if (!isValidOrgIdForDoc(targetOrgId)) {
            return res.status(400).json({ code: 400, msg: '組織 ID が不正です' });
          }
          const orgSnapSingle = await db.collection('orgs').doc(targetOrgId).get();
          if (!orgSnapSingle.exists) {
            return res.status(400).json({ code: 400, msg: '組織が存在しません' });
          }
          nextOrgIdExplicit = targetOrgId;
        }

        if (hasOrgIds) {
          const raw = body.orgIds;
          if (!Array.isArray(raw) || raw.length === 0) {
            return res.status(400).json({ code: 400, msg: 'orgIds は非空の配列が必要です' });
          }
          const uniq = [
            ...new Set(raw.map((x) => String(x || '').trim().toLowerCase()).filter(Boolean)),
          ];
          if (!uniq.length) {
            return res.status(400).json({ code: 400, msg: 'orgIds が不正です' });
          }
          try {
            await assertOrgIdsValid(db, uniq);
          } catch (e) {
            if (e.httpStatus === 400) {
              return res.status(400).json({
                code: 400,
                msg: String(e.message || '').startsWith('unknown org')
                  ? `組織が存在しません: ${String(e.message).replace(/^unknown org:\s*/i, '')}`
                  : '組織が存在しません',
              });
            }
            throw e;
          }
          nextOrgIdsExplicit = uniq;
        }

        if (nextOrgIdExplicit != null && nextOrgIdsExplicit != null && !nextOrgIdsExplicit.includes(nextOrgIdExplicit)) {
          return res.status(400).json({ code: 400, msg: 'orgId は orgIds に含まれる必要があります' });
        }

        const baseIds =
          nextOrgIdsExplicit != null
            ? [...nextOrgIdsExplicit]
            : normalizeOrgIds({ ...curData, orgId: nextOrgIdExplicit ?? curData.orgId });

        let primary =
          nextOrgIdExplicit != null ? nextOrgIdExplicit : '';
        if (!primary) {
          const cp = String(curData.orgId || '').trim();
          primary = baseIds.includes(cp) ? cp : baseIds[0];
        }
        if (!primary || !baseIds.includes(primary)) {
          primary = baseIds[0];
        }

        updates.orgId = primary;
        updates.orgIds = syncPrimaryOrgWithList(baseIds, primary).orgIds;
        changed = true;
      }
    } else {
      if (
        Object.prototype.hasOwnProperty.call(body, 'role') ||
        Object.prototype.hasOwnProperty.call(body, 'orgId') ||
        Object.prototype.hasOwnProperty.call(body, 'orgIds')
      ) {
        return res.status(400).json({
          code: 400,
          msg: 'superadmin の所属組織・組織一覧・ロールはこの画面から変更できません',
        });
      }
    }

    if (!changed) {
      return res.json({ code: 200, msg: '変更なし' });
    }

    await ref.update(updates);
    await appendDeviceAudit(req.user, 'platform.user.patch', {
      userId,
      keys: Object.keys(updates).filter((k) => k !== 'passwordHash' && k !== 'updatedAt'),
      passwordUpdated: Object.prototype.hasOwnProperty.call(updates, 'passwordHash'),
    });
    res.json({ code: 200 });
  });

  app.delete('/api/admin/platform/users/:userId', requireAuth(['superadmin']), async (req, res) => {
    applyCors(res, corsHeaders(req));
    const userId = String(req.params.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ code: 400, msg: 'ユーザー ID が不正です' });
    }
    if (userId === req.user.uid) {
      return res.status(400).json({ code: 400, msg: '自分自身は削除できません' });
    }
    const db = getFirestore();
    const ref = db.collection('users').doc(userId);
    const cur = await ref.get();
    if (!cur.exists) {
      return res.status(404).json({ code: 404, msg: 'ユーザーが見つかりません' });
    }
    const curData = cur.data() || {};
    if (curData.role === 'superadmin') {
      const n = await countSuperadmins(db);
      if (n <= 1) {
        return res.status(400).json({ code: 400, msg: '最後の superadmin は削除できません' });
      }
    }
    await ref.delete();
    await appendDeviceAudit(req.user, 'platform.user.delete', { userId });
    res.json({ code: 200 });
  });

  /** viewer / admin / superadmin — 自分のユーザー行のみ */
  const NOTIFICATION_AUTH_ROLES = ['viewer', 'admin', 'superadmin'];
  /** @returns {string} */
  function normalizeMinLevelForPush(s) {
    const t = String(s || '').trim();
    const allowed = new Set(['注意', '警戒', '厳重警戒', '危険']);
    if (allowed.has(t)) return t;
    return '厳重警戒';
  }

  /**
   * @param {FirebaseFirestore.Firestore} db
   * @param {string} uid
   * @param {string} rawToken
   */
  async function upsertUserPushToken(db, uid, rawToken) {
    const token = String(rawToken || '').trim().slice(0, 4096);
    if (!token.length) throw Object.assign(new Error('token が空です'), { httpCode: 400 });
    const ref = db.collection('users').doc(uid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw Object.assign(new Error('ユーザーが見つかりません'), { httpCode: 404 });
      }
      const u = snap.data() || {};
      const prev = Array.isArray(u.notificationPushTokens) ? [...u.notificationPushTokens] : [];
      const next = prev.filter((x) => x && x.token !== token);
      next.push({ token, createdAt: Date.now() });
      while (next.length > 10) next.shift();
      const prefs = typeof u.notificationPrefs === 'object' && u.notificationPrefs ? u.notificationPrefs : {};
      tx.update(ref, {
        notificationPushTokens: next,
        notificationPrefs: {
          ...prefs,
          enabled: true,
          minLevelForPush: normalizeMinLevelForPush(prefs.minLevelForPush || '厳重警戒'),
        },
        updatedAt: Date.now(),
      });
    });
  }

  /**
   * @param {FirebaseFirestore.Firestore} db
   * @param {string} uid
   * @param {string} rawToken
   */
  async function removeUserPushToken(db, uid, rawToken) {
    const token = String(rawToken || '').trim();
    if (!token.length) return;
    const ref = db.collection('users').doc(uid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const u = snap.data() || {};
      const prev = Array.isArray(u.notificationPushTokens) ? u.notificationPushTokens : [];
      const next = prev.filter((x) => !x || x.token !== token);
      tx.update(ref, { notificationPushTokens: next, updatedAt: Date.now() });
    });
  }

  app.get('/api/me/notification-settings', requireAuth(NOTIFICATION_AUTH_ROLES), async (req, res) => {
    applyCors(res, corsHeaders(req));
    try {
      const db = getFirestore();
      const snap = await db.collection('users').doc(req.user.uid).get();
      if (!snap.exists) return res.status(404).json({ code: 404, msg: 'ユーザーが見つかりません' });
      const u = snap.data() || {};
      const prefsRaw = typeof u.notificationPrefs === 'object' && u.notificationPrefs ? u.notificationPrefs : {};
      const tokens = Array.isArray(u.notificationPushTokens) ? u.notificationPushTokens : [];

      /** @typedef {{enabled?: boolean|null, minLevelForPush?: string}} Prefs */
      let enabledStored = prefsRaw.enabled;

      /** 未定義や null のときだけ：トークン登録済みならオン扱い */
      let enabledEffective;
      if (enabledStored === true) enabledEffective = true;
      else if (enabledStored === false) enabledEffective = false;
      else enabledEffective = tokens.length > 0;

      res.json({
        code: 200,
        prefs: {
          enabled: typeof enabledStored === 'boolean' ? enabledStored : enabledEffective,
          minLevelForPush: normalizeMinLevelForPush(prefsRaw.minLevelForPush),
        },
        registeredDeviceCount: tokens.length,
      });
    } catch (e) {
      console.error('/api/me/notification-settings GET', e);
      res.status(500).json({ code: 500, msg: '取得に失敗しました' });
    }
  });

  app.patch('/api/me/notification-settings', requireAuth(NOTIFICATION_AUTH_ROLES), async (req, res) => {
    applyCors(res, corsHeaders(req));
    try {
      const enabled = req.body?.enabled;
      const ml = req.body?.minLevelForPush;
      const hasBool = typeof enabled === 'boolean';
      const hasMl = ml !== undefined && ml !== null;
      if (!hasBool && !hasMl) {
        return res.status(400).json({ code: 400, msg: 'enabled または minLevelForPush を指定してください' });
      }
      const db = getFirestore();
      const ref = db.collection('users').doc(req.user.uid);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ code: 404, msg: 'ユーザーが見つかりません' });
      const prev = snap.data() || {};
      const oldPrefs =
        typeof prev.notificationPrefs === 'object' && prev.notificationPrefs ? prev.notificationPrefs : {};
      const nextPrefs = { ...oldPrefs };
      if (hasBool) nextPrefs.enabled = Boolean(enabled);
      if (hasMl) nextPrefs.minLevelForPush = normalizeMinLevelForPush(ml);
      await ref.update({
        notificationPrefs: nextPrefs,
        updatedAt: Date.now(),
      });
      res.json({ code: 200 });
    } catch (e) {
      console.error('/api/me/notification-settings PATCH', e);
      res.status(500).json({ code: 500, msg: '保存に失敗しました' });
    }
  });

  app.post('/api/me/push-token', requireAuth(NOTIFICATION_AUTH_ROLES), async (req, res) => {
    applyCors(res, corsHeaders(req));
    try {
      await upsertUserPushToken(getFirestore(), req.user.uid, req.body?.token || '');
      await appendDeviceAudit(req.user, 'notification.push.register', {});
      res.json({ code: 200 });
    } catch (e) {
      if (e.httpCode === 400) return res.status(400).json({ code: 400, msg: String(e.message) });
      if (e.httpCode === 404) return res.status(404).json({ code: 404, msg: String(e.message) });
      console.error('/api/me/push-token', e);
      res.status(500).json({ code: 500, msg: '登録に失敗しました' });
    }
  });

  app.delete('/api/me/push-token', requireAuth(NOTIFICATION_AUTH_ROLES), async (req, res) => {
    applyCors(res, corsHeaders(req));
    try {
      await removeUserPushToken(getFirestore(), req.user.uid, req.body?.token || '');
      res.json({ code: 200 });
    } catch (e) {
      console.error('/api/me/push-token DELETE', e);
      res.status(500).json({ code: 500, msg: '削除に失敗しました' });
    }
  });

  app.post('/api/me/notifications/test', requireAuth(NOTIFICATION_AUTH_ROLES), async (req, res) => {
    applyCors(res, corsHeaders(req));
    try {
      const db = getFirestore();
      const uid = req.user.uid;
      const snap = await db.collection('users').doc(uid).get();
      const tokens = snap.exists ? snap.data()?.notificationPushTokens || [] : [];
      const ids = tokens.map((x) => String(x?.token || '').trim()).filter(Boolean);
      if (!ids.length) return res.status(400).json({ code: 400, msg: '登録済みのトークンがありません' });

      await getMessaging().sendEachForMulticast({
        tokens: ids.slice(0, 50),
        notification: {
          title: 'GUARDIAN テスト通知',
          body:
            req.user.role === 'viewer'
              ? 'Viewer によるプッシュ確認です。異常検知とは別です。'
              : 'ログイン済みアカウントでのプッシュ確認です。',
        },
        data: {
          kind: 'test',
          role: String(req.user.role),
        },
      });
      await appendDeviceAudit(req.user, 'notification.push.test', { targets: ids.length });
      res.json({ code: 200 });
    } catch (e) {
      console.error('/api/me/notifications/test', e);
      res.status(500).json({
        code: 500,
        msg: 'テスト送信に失敗しました。Firebase とブラウザの通知許可を確認してください。',
      });
    }
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
