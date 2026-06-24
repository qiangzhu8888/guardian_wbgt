'use strict';

/**
 * BUILDICS 測定値パース — フロント `frontend/src/lib/buildicsMeasurements.js` と同一ロジック。
 */

function classifyBuildicsUnit(unitRaw) {
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

function roundVoltage(v) {
  return Math.round(v * 1000) / 1000;
}

function normalizeVoltageVolts(value, unitHint) {
  if (!Number.isFinite(value) || value <= 0) return null;
  const u = String(unitHint ?? '').toLowerCase();

  if (u === 'mv' || u.includes('millivolt')) {
    return roundVoltage(value / 1000);
  }
  if (u === 'v' || u === 'volt' || u === 'volts') {
    return roundVoltage(value);
  }
  if (value >= 100 && value <= 10000) {
    return roundVoltage(value / 1000);
  }
  if (value <= 20) {
    return roundVoltage(value);
  }
  return null;
}

function pickNumber(obj, keys) {
  for (const k of keys) {
    if (obj[k] == null || obj[k] === '') continue;
    const n = Number(obj[k]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseBuildicsRawJson(raw) {
  if (raw == null || raw === '') return null;

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

  const out = {};
  if (Number.isFinite(temp)) out.temp = temp;
  if (Number.isFinite(humidity)) out.humidity = humidity;
  if (Number.isFinite(voltage)) out.voltage = voltage;
  return out;
}

function parseBuildicsMeasurements(dataValue, typeUnit) {
  if (dataValue == null || dataValue === '') return null;

  const values = String(dataValue).split(',').map((s) => s.trim());
  const units =
    typeUnit != null && String(typeUnit).trim() !== ''
      ? String(typeUnit).split(',').map((s) => s.trim())
      : [];

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

function extractRawPayloadString(entry) {
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

function pickDeviceRawPayload(entries) {
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

function isAlivePayload(raw) {
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

function pickDeviceHeartbeatRaw(entries) {
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

function resolveDeviceVoltage(entries) {
  const raw = pickDeviceHeartbeatRaw(entries);
  if (!raw) return null;
  const parsed = parseBuildicsRawJson(raw);
  return Number.isFinite(parsed?.voltage) ? parsed.voltage : null;
}

function parseBuildicsDeviceEntry(entry, rawFallback) {
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

module.exports = {
  classifyBuildicsUnit,
  normalizeVoltageVolts,
  parseBuildicsRawJson,
  parseBuildicsMeasurements,
  extractRawPayloadString,
  pickDeviceRawPayload,
  isAlivePayload,
  pickDeviceHeartbeatRaw,
  resolveDeviceVoltage,
  parseBuildicsDeviceEntry,
};
