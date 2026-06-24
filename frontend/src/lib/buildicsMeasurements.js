/**
 * BUILDICS 測定値パース（dataValue/typeUnit + latestRawData JSON）
 * WBGT 用途では温度・湿度が必須。電圧は V / mV / 生 JSON の batt 等から取得。
 */

/**
 * @param {string} unitRaw
 * @returns {'temp'|'humidity'|'voltage'|'voltage_mv'|null}
 */
export function classifyBuildicsUnit(unitRaw) {
  const u = String(unitRaw ?? '').trim();
  if (!u) return null;
  const lower = u.toLowerCase();

  if (lower === 'mv' || lower === 'millivolt' || lower === 'millivolts') return 'voltage_mv';
  if (lower === 'v' || lower === 'volt' || lower === 'volts') return 'voltage';

  if (
    u.includes('℃') ||
    u.includes('°c') ||
    lower.includes('celsius') ||
    lower.includes('temp') ||
    u.includes('度')
  ) {
    return 'temp';
  }

  if (
    lower.includes('rh') ||
    lower.includes('humidity') ||
    lower.includes('hum') ||
    u.includes('湿度') ||
    u === '%' ||
    lower === '%rh'
  ) {
    return 'humidity';
  }

  return null;
}

/**
 * 電圧をボルト [V] に正規化。端末の batt は多く mV（例: 4007 → 4.007 V）。
 * @param {number} value
 * @param {string} [unitHint]
 * @returns {number|null}
 */
export function normalizeVoltageVolts(value, unitHint) {
  if (!Number.isFinite(value) || value <= 0) return null;
  const u = String(unitHint ?? '').toLowerCase();

  if (u === 'mv' || u.includes('millivolt')) {
    return roundVoltage(value / 1000);
  }
  if (u === 'v' || u === 'volt' || u === 'volts') {
    return roundVoltage(value);
  }
  /** 単位不明: 100〜10000 は mV とみなす（LiPo 系の batt 4007 等） */
  if (value >= 100 && value <= 10000) {
    return roundVoltage(value / 1000);
  }
  if (value <= 20) {
    return roundVoltage(value);
  }
  return null;
}

/**
 * @param {number} v
 * @returns {number}
 */
function roundVoltage(v) {
  return Math.round(v * 1000) / 1000;
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string[]} keys
 * @returns {number|null}
 */
function pickNumber(obj, keys) {
  for (const k of keys) {
    if (obj[k] == null || obj[k] === '') continue;
    const n = Number(obj[k]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * BUILDICS `latestRawData`（alive JSON 等）から温湿度・電圧を抽出
 * @param {unknown} raw
 * @returns {{ temp?: number, humidity?: number, voltage?: number } | null}
 */
export function parseBuildicsRawJson(raw) {
  if (raw == null || raw === '') return null;

  /** @type {Record<string, unknown>} */
  let obj;
  try {
    obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;

  const temp = pickNumber(obj, ['temp', 'temperature', 't']);
  const humidity = pickNumber(obj, ['hum', 'humidity', 'rh', 'h']);

  let voltage = null;
  if (obj.batt != null && obj.batt !== '') {
    voltage = normalizeVoltageVolts(Number(obj.batt), 'mv');
  } else if (obj.battery != null && obj.battery !== '') {
    voltage = normalizeVoltageVolts(Number(obj.battery), 'mv');
  } else if (obj.voltage != null && obj.voltage !== '') {
    voltage = normalizeVoltageVolts(Number(obj.voltage), String(obj.voltageUnit ?? obj.unit ?? 'V'));
  }

  if (!Number.isFinite(temp) && !Number.isFinite(humidity) && !Number.isFinite(voltage)) {
    return null;
  }

  /** @type {{ temp?: number, humidity?: number, voltage?: number }} */
  const out = {};
  if (Number.isFinite(temp)) out.temp = temp;
  if (Number.isFinite(humidity)) out.humidity = humidity;
  if (Number.isFinite(voltage)) out.voltage = voltage;
  return out;
}

/**
 * @param {unknown} dataValue
 * @param {unknown} [typeUnit]
 * @returns {{ temp: number, humidity: number, voltage?: number } | null}
 */
export function parseBuildicsMeasurements(dataValue, typeUnit) {
  if (dataValue == null || dataValue === '') return null;

  const values = String(dataValue).split(',').map((s) => s.trim());
  const units =
    typeUnit != null && String(typeUnit).trim() !== ''
      ? String(typeUnit).split(',').map((s) => s.trim())
      : [];

  /** @type {{ temp?: number, humidity?: number, voltage?: number }} */
  const out = {};

  if (units.length > 0) {
    for (let i = 0; i < values.length; i++) {
      const val = Number.parseFloat(values[i]);
      if (!Number.isFinite(val)) continue;
      const kind = classifyBuildicsUnit(units[i] ?? '');
      if (kind === 'temp') out.temp = val;
      else if (kind === 'humidity') out.humidity = val;
      else if (kind === 'voltage_mv') {
        const v = normalizeVoltageVolts(val, 'mv');
        if (Number.isFinite(v)) out.voltage = v;
      } else if (kind === 'voltage') {
        const v = normalizeVoltageVolts(val, 'v');
        if (Number.isFinite(v)) out.voltage = v;
      }
    }
  }

  if (!Number.isFinite(out.temp) && !Number.isFinite(out.humidity) && values.length >= 2) {
    const temp = Number.parseFloat(values[0]);
    const humidity = Number.parseFloat(values[1]);
    if (Number.isFinite(temp)) out.temp = temp;
    if (Number.isFinite(humidity)) out.humidity = humidity;
  }

  if (!Number.isFinite(out.voltage)) {
    for (let i = 0; i < values.length; i++) {
      const val = Number.parseFloat(values[i]);
      if (!Number.isFinite(val)) continue;
      const kind = classifyBuildicsUnit(units[i] ?? '');
      if (kind === 'voltage_mv' || kind === 'voltage') {
        const v = normalizeVoltageVolts(val, kind === 'voltage_mv' ? 'mv' : 'v');
        if (Number.isFinite(v)) {
          out.voltage = v;
          break;
        }
      }
    }
  }

  /** typeUnit なしで3列目以降が mV 級の電圧 */
  if (!Number.isFinite(out.voltage) && values.length >= 3) {
    const v3 = Number.parseFloat(values[2]);
    const v = normalizeVoltageVolts(v3, units[2] ?? '');
    if (Number.isFinite(v)) out.voltage = v;
  }

  if (!Number.isFinite(out.temp) || !Number.isFinite(out.humidity)) return null;

  const result = { temp: out.temp, humidity: out.humidity };
  if (Number.isFinite(out.voltage)) result.voltage = out.voltage;
  return result;
}

/**
 * BUILDICS 行から生 JSON 文字列を取り出す（フィールド名の揺れに対応）
 * @param {Record<string, unknown>|null|undefined} entry
 * @returns {string}
 */
export function extractRawPayloadString(entry) {
  if (!entry || typeof entry !== 'object') return '';
  const candidates = [
    entry.latestRawData,
    entry.LatestRawData,
    entry.rawData,
    entry.RawData,
  ];
  for (const c of candidates) {
    if (c == null || c === '') continue;
    const s = String(c).trim();
    if (s.startsWith('{') || s.startsWith('[')) return s;
  }
  return '';
}

/**
 * 同一デバイスの履歴行のうち、生 JSON（batt 等）を含むものを優先して1件選ぶ。
 * queryDeviceData の履歴取得では latestRawData が最新行以外に無い／空のことが多い。
 * @param {Array<Record<string, unknown>>} entries
 * @returns {string}
 */
export function pickDeviceRawPayload(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return '';
  const sorted = [...entries].sort(
    (a, b) => Number(b.latestDataTime || b.LatestDataTime) - Number(a.latestDataTime || a.LatestDataTime),
  );
  for (const row of sorted) {
    const raw = extractRawPayloadString(row);
    if (raw) return raw;
  }
  return '';
}

/**
 * alive / ハートビート JSON か（batt 等を含む）
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isAlivePayload(raw) {
  if (raw == null || raw === '') return false;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    if (obj.msg === 'alive' || obj.msg === 'heartbeat') return true;
    return obj.batt != null || obj.battery != null;
  } catch {
    return false;
  }
}

/**
 * ハートビート行の latestRawData を優先して1件選ぶ（通常測定行には batt が無い）
 * @param {Array<Record<string, unknown>>} entries
 * @returns {string}
 */
export function pickDeviceHeartbeatRaw(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return '';
  const sorted = [...entries].sort(
    (a, b) => Number(b.latestDataTime || b.LatestDataTime) - Number(a.latestDataTime || a.LatestDataTime),
  );
  for (const row of sorted) {
    const raw = extractRawPayloadString(row);
    if (raw && isAlivePayload(raw)) return raw;
  }
  return pickDeviceRawPayload(entries);
}

/**
 * デバイス単位の電池電圧 [V]。通常 dataValue には含まれないためハートビート raw のみ参照。
 * @param {Array<Record<string, unknown>>} entries 履歴 + 最新スナップショット行
 * @returns {number|null}
 */
export function resolveDeviceVoltage(entries) {
  const raw = pickDeviceHeartbeatRaw(entries);
  if (!raw) return null;
  const parsed = parseBuildicsRawJson(raw);
  return Number.isFinite(parsed?.voltage) ? parsed.voltage : null;
}

/**
 * queryDeviceData 1 件を統合パース（dataValue + latestRawData）
 * @param {Record<string, unknown>} entry
 * @param {unknown} [rawFallback] 同一デバイス別行の latestRawData 等
 * @returns {{ temp: number, humidity: number, voltage?: number } | null}
 */
export function parseBuildicsDeviceEntry(entry, rawFallback) {
  const dataValue = entry?.dataValue ?? entry?.DataValue;
  const typeUnit = entry?.typeUnit ?? entry?.TypeUnit;
  const ownRaw = extractRawPayloadString(entry);
  const latestRawData =
    ownRaw || (rawFallback != null && String(rawFallback).trim() !== '' ? String(rawFallback) : '');

  const fromValues = parseBuildicsMeasurements(dataValue, typeUnit);
  const fromRaw = latestRawData ? parseBuildicsRawJson(latestRawData) : null;

  if (fromValues && fromRaw) {
    if (!Number.isFinite(fromValues.voltage) && Number.isFinite(fromRaw.voltage)) {
      fromValues.voltage = fromRaw.voltage;
    }
    return fromValues;
  }

  if (fromValues) return fromValues;

  if (fromRaw && Number.isFinite(fromRaw.temp) && Number.isFinite(fromRaw.humidity)) {
    return {
      temp: fromRaw.temp,
      humidity: fromRaw.humidity,
      ...(Number.isFinite(fromRaw.voltage) ? { voltage: fromRaw.voltage } : {}),
    };
  }

  return null;
}

/**
 * 表示用電圧文字列（V 単位、最大3桁小数）
 * @param {number|null|undefined} volts
 * @returns {string}
 */
export function formatVoltageVolts(volts) {
  if (!Number.isFinite(volts)) return '';
  const v = roundVoltage(Number(volts));
  const s = v.toFixed(3).replace(/\.?0+$/, '');
  return s;
}
