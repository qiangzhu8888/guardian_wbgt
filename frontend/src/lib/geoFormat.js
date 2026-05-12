/** フォーム用に緯度経度を小数6桁に丸めた文字列へ（無効なら空文字） */
export function roundCoordForForm(n) {
  if (n === '' || n === null || n === undefined) return '';
  const x = Number(n);
  if (!Number.isFinite(x)) return '';
  return String(Math.round(x * 1e6) / 1e6);
}

/**
 * 緯度・経度の入力欄から数値を得る。空欄は Number('')===0 にならないよう未入力扱い。
 * @returns {{ lat: number, lng: number } | null}
 */
export function parseDraftLatLng(draftLat, draftLng) {
  const a = String(draftLat ?? '').trim();
  const b = String(draftLng ?? '').trim();
  if (a === '' || b === '') return null;
  const lat = Number(a);
  const lng = Number(b);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** 場所追加フォームの初期値・登録後リセット用（東京都庁付近） */
export const DEFAULT_TOKYO_LAT = '35.6812';
export const DEFAULT_TOKYO_LNG = '139.7671';
