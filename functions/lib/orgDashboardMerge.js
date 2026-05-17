'use strict';

const MAX_TITLE = 120;
const MAX_SUBTITLE = 200;
const MAX_LOGO_URL = 500;
const MAX_BUILDICS_KEY = 500;

/** 監視ダッシュボードの BUILDICS ポーリング間隔（公開設定で上書き可） */
const MIN_POLLING_INTERVAL_MS = 60_000;
const MAX_POLLING_INTERVAL_MS = 86_400_000;

/** @type {Set<string>} */
const BUILTIN_LOGO_HOSTS = new Set([
  'storage.googleapis.com',
  'firebasestorage.googleapis.com',
]);

/**
 * カンマ区切りで追加（ホスト名のみ、小文字）。オプションで `*.example.com`（サフィックス一致）。
 * @returns {string[]}
 */
function logoHostsFromEnv() {
  const raw = process.env.LOGO_URL_ALLOWED_HOSTS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
function isLogoHostnameAllowed(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (!h) return false;
  if (BUILTIN_LOGO_HOSTS.has(h)) return true;
  if (h.endsWith('.googleapis.com')) return true;
  if (h.endsWith('.firebasestorage.app')) return true;
  for (const entry of logoHostsFromEnv()) {
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(2);
      if (suffix && (h === suffix || h.endsWith(`.${suffix}`))) return true;
    } else if (h === entry) return true;
  }
  return false;
}

/**
 * @param {unknown} raw
 * @param {number} maxLen
 * @returns {string | null}
 */
function sanitizeDashboardText(raw, maxLen) {
  if (raw == null || raw === '') return null;
  const t = String(raw)
    .replace(/\r?\n/g, ' ')
    .trim()
    .slice(0, maxLen);
  return t || null;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function parseThemePrimary(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(s)) return null;
  return s.toUpperCase();
}

/**
 * @param {unknown} raw
 * @returns {number | null} null = org で未設定（公開設定の polling をそのまま）
 */
function parseStoredPollingIntervalMs(raw) {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < MIN_POLLING_INTERVAL_MS || n > MAX_POLLING_INTERVAL_MS) return null;
  return Math.round(n);
}

/**
 * PATCH 用（不正値はエラー、空は削除）
 * @param {unknown} val
 * @returns {{ ok: true, value: '' } | { ok: true, value: number } | { ok: false, msg: string }}
 */
function validatePollingIntervalMsPatch(val) {
  if (val == null || val === '') return { ok: true, value: '' };
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return { ok: false, msg: '自動更新間隔が不正です' };
  const rounded = Math.round(n);
  if (rounded < MIN_POLLING_INTERVAL_MS) {
    return { ok: false, msg: `自動更新間隔は最短 ${MIN_POLLING_INTERVAL_MS / 60000} 分です` };
  }
  if (rounded > MAX_POLLING_INTERVAL_MS) {
    return { ok: false, msg: `自動更新間隔は最長 ${MAX_POLLING_INTERVAL_MS / 3600000} 時間です` };
  }
  return { ok: true, value: rounded };
}

function parseLogoUrl(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().slice(0, MAX_LOGO_URL);
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  if (!isLogoHostnameAllowed(u.hostname)) return null;
  return u.toString();
}

/**
 * 公開 config 用。`buildicsApiKey` は読まない。
 * @param {Record<string, unknown>} baseConfig
 * @param {Record<string, unknown> | undefined} orgData
 * @returns {Record<string, unknown>}
 */
function mergeOrgDashboardIntoConfig(baseConfig, orgData) {
  if (!orgData || typeof orgData !== 'object') return baseConfig;
  const out = { ...baseConfig };
  const title = sanitizeDashboardText(orgData.dashboardTitle, MAX_TITLE);
  if (title) out.title = title;
  const subtitle = sanitizeDashboardText(orgData.dashboardSubtitle, MAX_SUBTITLE);
  if (subtitle) out.subtitle = subtitle;
  const theme = parseThemePrimary(orgData.themePrimary);
  if (theme) out.themePrimary = theme;
  const logo = parseLogoUrl(orgData.logoUrl);
  if (logo) out.logoUrl = logo;
  const pollingMs = parseStoredPollingIntervalMs(orgData.pollingIntervalMs);
  if (pollingMs != null) {
    const basePolling =
      baseConfig.polling && typeof baseConfig.polling === 'object' ? { ...baseConfig.polling } : {};
    out.polling = { ...basePolling, intervalMs: pollingMs };
  }
  return out;
}

/**
 * 管理画面 GET 用（シークレットはマスク）
 * @param {string} orgId
 * @param {Record<string, unknown> | undefined} data
 */
function buildAdminOrgSettingsResponse(orgId, data) {
  const d = data && typeof data === 'object' ? data : {};
  const key = String(d.buildicsApiKey || '').trim();
  return {
    orgId,
    slug: d.slug != null ? String(d.slug) : null,
    name: d.name != null ? String(d.name) : null,
    disabled: d.disabled === true,
    dashboardTitle: d.dashboardTitle != null ? String(d.dashboardTitle) : '',
    dashboardSubtitle: d.dashboardSubtitle != null ? String(d.dashboardSubtitle) : '',
    themePrimary: d.themePrimary != null ? String(d.themePrimary) : '',
    logoUrl: d.logoUrl != null ? String(d.logoUrl) : '',
    pollingIntervalMs:
      typeof d.pollingIntervalMs === 'number' && Number.isFinite(d.pollingIntervalMs)
        ? Math.round(d.pollingIntervalMs)
        : null,
    buildicsApiKeyConfigured: key.length > 0,
    buildicsApiKeyLast4: key.length >= 4 ? key.slice(-4) : null,
  };
}

/**
 * PATCH のフィールド検証（エラー時は msg）
 * @param {string} field
 * @param {unknown} val
 * @returns {{ ok: true, value: string | number | '' } | { ok: false, msg: string }}
 */
function validateDashboardPatchField(field, val) {
  if (field === 'dashboardTitle') {
    if (val == null || String(val).trim() === '') return { ok: true, value: '' };
    const v = sanitizeDashboardText(val, MAX_TITLE);
    if (!v) return { ok: false, msg: 'ダッシュボードタイトルが不正です' };
    return { ok: true, value: v };
  }
  if (field === 'dashboardSubtitle') {
    if (val == null || String(val).trim() === '') return { ok: true, value: '' };
    const v = sanitizeDashboardText(val, MAX_SUBTITLE);
    if (!v) return { ok: false, msg: 'サブタイトルが不正です' };
    return { ok: true, value: v };
  }
  if (field === 'themePrimary') {
    const s = val == null ? '' : String(val).trim();
    if (!s) return { ok: true, value: '' };
    const t = parseThemePrimary(s);
    if (!t) return { ok: false, msg: 'テーマ色は #RRGGBB 形式で指定してください' };
    return { ok: true, value: t };
  }
  if (field === 'logoUrl') {
    const s = val == null ? '' : String(val).trim();
    if (!s) return { ok: true, value: '' };
    const u = parseLogoUrl(s);
    if (!u) return { ok: false, msg: 'ロゴ URL が許可されていないか不正です（HTTPS・許可ホストのみ）' };
    return { ok: true, value: u };
  }
  if (field === 'pollingIntervalMs') {
    return validatePollingIntervalMsPatch(val);
  }
  return { ok: false, msg: '不明なフィールドです' };
}

/**
 * @param {Record<string, unknown>} body
 * @returns {{ action: 'skip' } | { action: 'clear' } | { action: 'set', value: string } | { action: 'error', msg: string }}
 */
function normalizeBuildicsApiKeyPatch(body) {
  if (!Object.prototype.hasOwnProperty.call(body, 'buildicsApiKey')) {
    return { action: 'skip' };
  }
  const raw = body.buildicsApiKey;
  if (raw === null || raw === '') return { action: 'clear' };
  const s = String(raw).trim();
  if (s.length > MAX_BUILDICS_KEY) {
    return { action: 'error', msg: 'BUILDICS API キーが長すぎます' };
  }
  if (/[\r\n\u0000]/.test(s)) {
    return { action: 'error', msg: 'BUILDICS API キーに使用できない文字が含まれています' };
  }
  return { action: 'set', value: s };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} ledgerOrgId
 * @returns {Promise<string>}
 */
async function getBuildicsApiKeyForLedger(db, ledgerOrgId) {
  const snap = await db.collection('orgs').doc(ledgerOrgId).get();
  let fromDoc = '';
  if (snap.exists) {
    const d = snap.data() || {};
    fromDoc = String(d.buildicsApiKey || '').trim();
  }
  if (fromDoc) return fromDoc;
  return String(process.env.BUILDICS_API_KEY || '').trim();
}

module.exports = {
  MAX_TITLE,
  MAX_SUBTITLE,
  MAX_LOGO_URL,
  MAX_BUILDICS_KEY,
  MIN_POLLING_INTERVAL_MS,
  MAX_POLLING_INTERVAL_MS,
  parseStoredPollingIntervalMs,
  validatePollingIntervalMsPatch,
  BUILTIN_LOGO_HOSTS,
  isLogoHostnameAllowed,
  mergeOrgDashboardIntoConfig,
  buildAdminOrgSettingsResponse,
  validateDashboardPatchField,
  normalizeBuildicsApiKeyPatch,
  getBuildicsApiKeyForLedger,
  parseLogoUrl,
  parseThemePrimary,
  sanitizeDashboardText,
};
