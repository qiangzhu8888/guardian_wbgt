/** BUILDICS デバイス ID（6〜24 桁の数字） */
export const DEVICE_ID_PATTERN = /^\d{6,24}$/;

/** 入力・表示の例（15 桁 IMEI） */
export const DEVICE_ID_DISPLAY_EXAMPLE = '350 976 658 106 130';

/**
 * 入力文字列から数字のみ抽出（最大 24 桁）
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeDeviceIdInput(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 24);
}

/**
 * 一覧・詳細向けの読みやすい表示（3 桁区切り）
 * @param {unknown} deviceId
 * @returns {string}
 */
export function formatDeviceIdDisplay(deviceId) {
  const id = normalizeDeviceIdInput(deviceId);
  if (!id) return '';
  if (!DEVICE_ID_PATTERN.test(id)) {
    return String(deviceId ?? '').trim();
  }

  const parts = [];
  let i = 0;
  while (i < id.length) {
    const remaining = id.length - i;
    if (remaining <= 4) {
      parts.push(id.slice(i));
      break;
    }
    parts.push(id.slice(i, i + 3));
    i += 3;
  }
  return parts.join(' ');
}

/**
 * トースト・確認ダイアログ向け
 * @param {unknown} deviceId
 * @returns {string}
 */
export function formatDeviceIdForMessage(deviceId) {
  const formatted = formatDeviceIdDisplay(deviceId);
  return formatted || String(deviceId ?? '').trim();
}
