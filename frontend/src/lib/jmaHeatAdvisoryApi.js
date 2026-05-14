import { adminApiUrl } from './publicApi';

/** @returns {string} */
function advisoryUrl(lat, lng) {
  const q = new URLSearchParams({ lat: String(lat), lon: String(lng) });
  return `${adminApiUrl('/api/public/jma-wbgt/advisory')}?${q}`;
}

/**
 * 気象庁 熱中症警戒アラート（VPFT50）参考
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ ok: true, json: object } | { ok: false, status: number, msg: string }>}
 */
export async function fetchJmaHeatAdvisory(lat, lng) {
  const res = await fetch(advisoryUrl(lat, lng));
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof json.msg === 'string' ? json.msg : `HTTP ${res.status}`;
    return { ok: false, status: res.status, msg };
  }
  return { ok: true, json };
}

/**
 * ダッシュボード用: 複数施設の気象庁熱中症警戒アラート一括取得
 * @param {Array<{ id: string | number, lat: number, lng: number }>} facilities
 */
export async function postJmaHeatAdvisoryBatch(facilities) {
  const res = await fetch(adminApiUrl('/api/public/jma-wbgt/advisory/batch'), {
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
