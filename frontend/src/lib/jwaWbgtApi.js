import { adminApiUrl } from './publicApi';

/** @returns {string} */
function hourlyUrl(lat, lng) {
  const q = new URLSearchParams({ lat: String(lat), lon: String(lng) });
  return `${adminApiUrl('/api/public/jwa-wbgt/forecasts/hourly')}?${q}`;
}

/** @returns {string} */
function dailyUrl(lat, lng) {
  const q = new URLSearchParams({ lat: String(lat), lon: String(lng) });
  return `${adminApiUrl('/api/public/jwa-wbgt/forecasts/daily')}?${q}`;
}

/**
 * 日本気象協会（JWA）1km メッシュ WBGT 予測（時別）
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ ok: true, json: object } | { ok: false, status: number, msg: string }>}
 */
export async function fetchJwaHourlyForecast(lat, lng) {
  const res = await fetch(hourlyUrl(lat, lng));
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof json.msg === 'string' ? json.msg : `HTTP ${res.status}`;
    return { ok: false, status: res.status, msg };
  }
  return { ok: true, json };
}

/**
 * JWA 1km メッシュ WBGT 予測（日別・最大8日）
 * @param {number} lat
 * @param {number} lng
 */
export async function fetchJwaDailyForecast(lat, lng) {
  const res = await fetch(dailyUrl(lat, lng));
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof json.msg === 'string' ? json.msg : `HTTP ${res.status}`;
    return { ok: false, status: res.status, msg };
  }
  return { ok: true, json };
}

/**
 * ダッシュボード用: 複数地点の JWA 時別予測
 * @param {Array<{ id: string | number, lat?: number, lng?: number, lon?: number }>} facilities
 */
export async function postJwaHourlyForecastBatch(facilities) {
  const res = await fetch(adminApiUrl('/api/public/jwa-wbgt/forecasts/hourly/batch'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ facilities }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof json.msg === 'string' ? json.msg : `HTTP ${res.status}`;
    return { ok: false, status: res.status, msg };
  }
  return { ok: true, json };
}
