'use strict';

const GSI_SEARCH = 'https://msearch.gsi.go.jp/address-search/AddressSearch';

const MIN_QUERY = 3;
const MAX_QUERY = 200;

/**
 * @param {unknown} body
 * @returns {{ ok: true, lat: number, lng: number, label?: string } | { ok: false, msg: string }}
 */
function parseGsiAddressSearchResults(body) {
  if (!Array.isArray(body) || body.length === 0) {
    return { ok: false, msg: '該当する位置が見つかりませんでした' };
  }
  const first = body[0];
  const coords = first?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { ok: false, msg: '検索結果の形式が不正です' };
  }
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, msg: '緯度経度を解釈できませんでした' };
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { ok: false, msg: '緯度経度が範囲外です' };
  }
  const title = first.properties && typeof first.properties.title === 'string' ? first.properties.title : '';
  return { ok: true, lat, lng, label: title || undefined };
}

/**
 * @param {string} address
 * @returns {Promise<{ ok: true, lat: number, lng: number, label?: string } | { ok: false, msg: string }>}
 */
async function geocodeAddressWithGsi(address) {
  const q = String(address || '').trim();
  if (q.length < MIN_QUERY) {
    return { ok: false, msg: `住所は${MIN_QUERY}文字以上入力してください` };
  }
  if (q.length > MAX_QUERY) {
    return { ok: false, msg: `住所は${MAX_QUERY}文字以内にしてください` };
  }
  const url = `${GSI_SEARCH}?q=${encodeURIComponent(q)}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WBGT-Facility-Admin/1.0 (geocoding; contact: org IT)',
      },
    });
  } catch (e) {
    console.error('gsi geocode fetch', e);
    return { ok: false, msg: '住所検索サービスに接続できませんでした' };
  }
  if (!res.ok) {
    return { ok: false, msg: '住所検索サービスが応答しませんでした' };
  }
  let json;
  try {
    json = await res.json();
  } catch {
    return { ok: false, msg: '検索結果の読み取りに失敗しました' };
  }
  return parseGsiAddressSearchResults(json);
}

module.exports = {
  MIN_QUERY,
  MAX_QUERY,
  parseGsiAddressSearchResults,
  geocodeAddressWithGsi,
};
