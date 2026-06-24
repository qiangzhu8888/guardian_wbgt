/**
 * BUILDICS `/common/apgateway/status` の battery（％）を deviceId に紐付ける。
 */

/**
 * @param {unknown} raw
 * @returns {number|null} 0–100、無効（-1 等）は null
 */
export function parseGatewayBatteryPercent(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 100) return null;
  return Math.round(n);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeGatewayMatchId(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * ゲートウェイ行が台帳 deviceId（IMEI 等）に一致するか
 * @param {Record<string, unknown>} row
 * @param {string} deviceId
 * @returns {boolean}
 */
export function gatewayRowMatchesDeviceId(row, deviceId) {
  const target = String(deviceId || '').trim();
  if (!target) return false;
  const targetDigits = normalizeGatewayMatchId(target);

  const candidates = [
    row.imei,
    row.Imei,
    row.IMEI,
    row.mac,
    row.Mac,
    row.MAC,
    row.deviceId,
    row.DeviceId,
  ];

  for (const c of candidates) {
    if (c == null || c === '') continue;
    const s = String(c).trim();
    if (s === target) return true;
    if (targetDigits && normalizeGatewayMatchId(s) === targetDigits) return true;
  }
  return false;
}

/**
 * @param {unknown[]} gatewayList
 * @param {string} deviceId
 * @returns {number|null}
 */
export function findGatewayBatteryPercentForDevice(gatewayList, deviceId) {
  if (!Array.isArray(gatewayList) || !deviceId) return null;
  for (const row of gatewayList) {
    if (!row || typeof row !== 'object') continue;
    if (!gatewayRowMatchesDeviceId(row, deviceId)) continue;
    const pct = parseGatewayBatteryPercent(row.battery ?? row.Battery);
    if (pct != null) return pct;
  }
  return null;
}

/**
 * @param {unknown[]} gatewayList
 * @param {string[]} deviceIds
 * @returns {Map<string, number>}
 */
export function buildGatewayBatteryByDeviceId(gatewayList, deviceIds) {
  /** @type {Map<string, number>} */
  const map = new Map();
  if (!Array.isArray(deviceIds)) return map;
  for (const id of deviceIds) {
    const deviceId = String(id || '').trim();
    if (!deviceId) continue;
    const pct = findGatewayBatteryPercentForDevice(gatewayList, deviceId);
    if (pct != null) map.set(deviceId, pct);
  }
  return map;
}

/**
 * @param {number} nowMs
 * @param {number} [windowHours]
 * @returns {{ startTime: number, endTime: number }}
 */
export function buildApGatewayStatusBody(nowMs, windowHours = 24) {
  const endTime = nowMs;
  const startTime = nowMs - windowHours * 60 * 60 * 1000;
  return { startTime, endTime };
}
