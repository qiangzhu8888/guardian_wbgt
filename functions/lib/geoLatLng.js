'use strict';

/**
 * @param {unknown} lat
 * @param {unknown} lng
 * @returns {boolean}
 */
function isUsableLatLng(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return false;
  if (Math.abs(la) < 1e-9 && Math.abs(ln) < 1e-9) return false;
  return true;
}

/**
 * @param {Record<string, unknown>} q
 * @returns {string|null} 拒否理由（利用可なら null）
 */
function latLonRejectMessage(q) {
  const lat = Number(q.lat);
  const lng = Number(q.lon != null ? q.lon : q.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) < 1e-9 && Math.abs(lng) < 1e-9) {
    return '緯度経度が未設定（0,0）です。施設マスタで設定してください。';
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return 'lat と lon（または lng）を数値で指定してください';
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return '緯度・経度が範囲外です';
  }
  return null;
}

/**
 * @param {Record<string, unknown>} q
 * @returns {{ lat: number, lng: number } | null}
 */
function parseUsableLatLonQuery(q) {
  const lat = Number(q.lat);
  const lng = Number(q.lon != null ? q.lon : q.lng);
  if (!isUsableLatLng(lat, lng)) return null;
  return { lat, lng };
}

module.exports = {
  isUsableLatLng,
  parseUsableLatLonQuery,
  latLonRejectMessage,
};
