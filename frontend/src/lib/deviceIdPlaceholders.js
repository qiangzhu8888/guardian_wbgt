/**
 * functions/lib/deviceIdPlaceholders.js と同じ判定（同期を維持すること）
 * @param {string | undefined} deviceId
 */
export function looksLikePlaceholderDeviceId(deviceId) {
  const id = String(deviceId || '').trim();
  if (!/^\d{6,24}$/.test(id)) return false;

  if (/^(\d)\1+$/.test(id)) return true;
  if (/^0{6,}/.test(id)) return true;
  if (/^(?:0123456789|123456789012|987654321098)/.test(id)) return true;

  const digits = id.split('');
  const unique = new Set(digits);
  if (id.length >= 12 && unique.size <= 3) return true;

  let ascending = 0;
  let descending = 0;
  for (let i = 1; i < digits.length; i += 1) {
    const a = Number(digits[i - 1]);
    const b = Number(digits[i]);
    if (b === (a + 1) % 10) ascending += 1;
    if (b === (a + 9) % 10) descending += 1;
  }
  const runThreshold = Math.max(8, Math.floor(id.length * 0.75));
  if (ascending >= runThreshold || descending >= runThreshold) return true;

  return false;
}
