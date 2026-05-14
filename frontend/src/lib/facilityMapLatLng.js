/**
 * 管理画面の地図用: 入力欄の緯度経度を数値に解釈
 * @param {unknown} latStr
 * @param {unknown} lngStr
 * @returns {{ lat: number, lng: number } | null}
 */
export function parseOptionalLatLng(latStr, lngStr) {
  const laStr = String(latStr ?? '').trim();
  const lnStr = String(lngStr ?? '').trim();
  if (!laStr || !lnStr) return null;
  const la = Number(laStr);
  const ln = Number(lnStr);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {number} [digits=6]
 */
export function formatLatLngInput(lat, lng, digits = 6) {
  return {
    lat: lat.toFixed(digits),
    lng: lng.toFixed(digits),
  };
}
