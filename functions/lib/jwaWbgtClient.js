'use strict';

/**
 * 日本気象協会（JWA）暑さ指数（WBGT）API クライアント
 * @see リポジトリ直下 SKILL.md（wbgt-jwa-api）
 *
 * 認証: X-api-key と Apikey の両ヘッダー必須（Bearer は不可）
 */

const JWA_BASE = 'https://api.jwa.or.jp';

function trimKey(v) {
  if (v == null || typeof v !== 'string') return '';
  let s = v.replace(/^\uFEFF/, '').trim();
  /** .env で誤って `KEY="secret"` と書くと値に引用符が残る環境がある */
  while (s.length >= 2) {
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.slice(1, -1).trim();
      continue;
    }
    if (s.startsWith("'") && s.endsWith("'")) {
      s = s.slice(1, -1).trim();
      continue;
    }
    break;
  }
  return s;
}

function getJwaAuthHeaders() {
  const x = trimKey(process.env.JWA_X_API_KEY);
  const k = trimKey(process.env.JWA_APIKEY);
  if (!x || !k) return null;
  return {
    'X-api-key': x,
    Apikey: k,
    'Content-Type': 'application/json;charset=UTF-8',
  };
}

function isJwaConfigured() {
  return Boolean(getJwaAuthHeaders());
}

/**
 * @param {Record<string, unknown>} q Express req.query
 * @returns {{ lat: number, lng: number } | null}
 */
function parseLatLonQuery(q) {
  const lat = Number(q.lat);
  const lng = Number(q.lon != null ? q.lon : q.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function formatPointSegment(lat, lng) {
  return `${Math.round(lat * 1e6) / 1e6},${Math.round(lng * 1e6) / 1e6}`;
}

const RANK_TO_LEVEL = Object.freeze(['ほぼ安全', '注意', '警戒', '厳重警戒', '危険']);

function rankToLevel(rank) {
  if (rank == null || rank === '') return null;
  const n = Number(rank);
  if (!Number.isInteger(n) || n < 0 || n > 4) return null;
  return RANK_TO_LEVEL[n];
}

/**
 * JWA `wbgt` を摂氏に変換する。
 * 仕様上は 0.1℃ 単位の数値（例: 285 → 28.5℃）だが、実レスポンスでは
 * - 既に摂氏の実数（例: 28.5）
 * - 摂氏に近い整数（例: 21 が 21℃ だが ÷10 すると 2.1℃）
 * が返る事例がある。その場合は異常値として再解釈する。
 *
 * @param {unknown} wbgtRaw
 * @returns {number | null} 摂氏（小数第1位まで）
 */
function wbgtToCelsius(wbgtRaw) {
  if (wbgtRaw == null || Number.isNaN(Number(wbgtRaw))) return null;
  const n = Number(wbgtRaw);
  if (!Number.isFinite(n)) return null;

  /** 小数は「すでに ℃」として扱う（例 28.5℃） */
  if (!Number.isInteger(n) && n > 8 && n < 52) {
    return Math.round(n * 10) / 10;
  }

  const fromTenths = Math.round(n) / 10;

  /**
   * 整数で 14〜44 かつ ÷10 だと 6℃未満 → 暑さ指数として不自然なので「℃整数」とみなす
   * （例 21 → 21℃／210 は ÷10 で 21℃ となりここに掛からない）
   */
  const roundedInt = Number.isInteger(n) ? n : Math.round(n);
  if (
    Number.isInteger(roundedInt) &&
    fromTenths < 6 &&
    roundedInt >= 14 &&
    roundedInt <= 44
  ) {
    return Math.round(roundedInt * 10) / 10;
  }

  return fromTenths;
}

/**
 * @param {object} json JWA レスポンス
 */
function normalizeHourlyForecastBody(json) {
  const results = json && typeof json === 'object' ? json.results : null;
  if (!results || !Array.isArray(results.data)) {
    return { error: 'invalid_response', message: 'JWA の応答形式が不正です' };
  }
  const rows = results.data.map((d) => ({
    time: d.time != null ? String(d.time) : null,
    wbgtCelsius: wbgtToCelsius(d.wbgt),
    rank: d.rank != null && d.rank !== '' ? Number(d.rank) : null,
    level: rankToLevel(d.rank),
  }));
  return {
    meshCode: results.mesh_code != null ? String(results.mesh_code) : null,
    referenceTime: results.reference_time != null ? String(results.reference_time) : null,
    initialTime: results.initial_time != null ? String(results.initial_time) : null,
    timeZone: results.time_zone != null ? String(results.time_zone) : null,
    elevation: results.elevation != null ? String(results.elevation) : null,
    data: rows,
  };
}

/**
 * @param {object} json JWA レスポンス
 */
function normalizeDailyForecastBody(json) {
  const results = json && typeof json === 'object' ? json.results : null;
  if (!results || !Array.isArray(results.data)) {
    return { error: 'invalid_response', message: 'JWA の応答形式が不正です' };
  }
  const rows = results.data.map((d) => ({
    date: d.date != null ? String(d.date) : null,
    maxWbgtCelsius: wbgtToCelsius(d.max_wbgt),
    minWbgtCelsius: wbgtToCelsius(d.min_wbgt),
    rank: d.rank != null && d.rank !== '' ? Number(d.rank) : null,
    level: rankToLevel(d.rank),
  }));
  return {
    meshCode: results.mesh_code != null ? String(results.mesh_code) : null,
    referenceTime: results.reference_time != null ? String(results.reference_time) : null,
    initialTime: results.initial_time != null ? String(results.initial_time) : null,
    timeZone: results.time_zone != null ? String(results.time_zone) : null,
    elevation: results.elevation != null ? String(results.elevation) : null,
    data: rows,
  };
}

/**
 * @param {string} path JWA のパス（/v3/...）
 */
async function fetchJwaJson(path) {
  const headers = getJwaAuthHeaders();
  if (!headers) {
    const e = new Error('JWA API キーが未設定です');
    e.code = 'not_configured';
    throw e;
  }
  const url = `${JWA_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    const e = new Error('JWA API への接続に失敗しました');
    e.code = 'upstream_network';
    e.cause = err;
    throw e;
  }
  const text = await res.text();
  if (!res.ok) {
    const e = new Error(res.status === 401 ? 'JWA API 認証に失敗しました' : `JWA API エラー (${res.status})`);
    e.code = 'upstream_http';
    e.status = res.status;
    e.bodySnippet = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    throw e;
  }
  try {
    return JSON.parse(text);
  } catch {
    const e = new Error('JWA の応答を JSON として解析できませんでした');
    e.code = 'invalid_json';
    throw e;
  }
}

async function fetchHourlyForecastByPoint(lat, lng) {
  const seg = formatPointSegment(lat, lng);
  const json = await fetchJwaJson(`/v3/jpmesh/wbgt/forecasts/hourly/point/${seg}.json`);
  return normalizeHourlyForecastBody(json);
}

const JWA_BATCH_MAX = 24;

/**
 * ダッシュボード用: 各地点の時別予測を順次取得（JWA は地点ごとに API が分かれる）
 * @param {Array<{ id: string | number, lat: number, lng: number }>} items
 */
async function fetchHourlyForecastBatch(items) {
  if (!getJwaAuthHeaders()) {
    const e = new Error('JWA API キーが未設定です');
    e.code = 'not_configured';
    throw e;
  }
  /** @type {Array<Record<string, unknown>>} */
  const out = [];
  for (const it of items) {
    try {
      if (it.lat == null || it.lng == null) {
        out.push({
          id: it.id,
          ok: false,
          msg: '緯度経度（lat・lon または lng）が必要です',
        });
        continue;
      }
      const payload = await fetchHourlyForecastByPoint(it.lat, it.lng);
      if (payload && payload.error) {
        out.push({
          id: it.id,
          ok: false,
          msg: String(payload.message || 'JWA 応答の解釈に失敗しました'),
        });
        continue;
      }
      const dataArr = Array.isArray(payload.data) ? payload.data : [];
      out.push({
        id: it.id,
        ok: true,
        meshCode: payload.meshCode,
        referenceTime: payload.referenceTime,
        initialTime: payload.initialTime,
        preview: dataArr.slice(0, 24).map((d) => ({
          time: d.time,
          wbgtCelsius: d.wbgtCelsius,
          level: d.level,
        })),
      });
    } catch (err) {
      out.push({
        id: it.id,
        ok: false,
        msg: err && err.message ? String(err.message) : 'JWA API の取得に失敗しました',
      });
    }
  }
  return out;
}

async function fetchDailyForecastByPoint(lat, lng) {
  const seg = formatPointSegment(lat, lng);
  const json = await fetchJwaJson(`/v3/jpmesh/wbgt/forecasts/daily/point/${seg}.json`);
  return normalizeDailyForecastBody(json);
}

module.exports = {
  JWA_BASE,
  JWA_BATCH_MAX,
  isJwaConfigured,
  getJwaAuthHeaders,
  parseLatLonQuery,
  formatPointSegment,
  rankToLevel,
  wbgtToCelsius,
  normalizeHourlyForecastBody,
  normalizeDailyForecastBody,
  fetchJwaJson,
  fetchHourlyForecastByPoint,
  fetchHourlyForecastBatch,
  fetchDailyForecastByPoint,
};
