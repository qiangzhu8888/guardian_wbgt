/**
 * ハートビート／ゲートウェイ API は間欠のため、一度取得した電池情報をセッション内で保持する。
 */

const STORAGE_KEY = 'wbgt_last_battery_v2';

/**
 * @param {string | undefined} orgSlug
 * @param {number | string} facilityId
 * @returns {string}
 */
export function batteryCacheKey(orgSlug, facilityId) {
  return `${String(orgSlug || '_').trim() || '_'}:${facilityId}`;
}

/**
 * @typedef {{ voltage?: number, percent?: number, at?: number }} BatteryCacheEntry
 */

/**
 * @returns {Record<string, BatteryCacheEntry>}
 */
function readPersistedStore() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, BatteryCacheEntry>} store
 */
function writePersistedStore(store) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

/**
 * @param {BatteryCacheEntry | undefined} entry
 * @returns {BatteryCacheEntry | null}
 */
function validEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const hasVoltage = Number.isFinite(entry.voltage) && entry.voltage > 0;
  const hasPercent = Number.isFinite(entry.percent) && entry.percent >= 0;
  if (!hasVoltage && !hasPercent) return null;
  return entry;
}

/**
 * @param {string | undefined} orgSlug
 * @param {number | string} facilityId
 * @param {{ freshVoltage?: number|null, freshPercent?: number|null }} fresh
 * @param {Map<string, BatteryCacheEntry>} memCache
 * @returns {{
 *   voltage: number|null,
 *   batteryPercent: number|null,
 *   batteryCached: boolean,
 *   batterySource: 'gateway'|'heartbeat'|null,
 * }}
 */
export function resolveLastKnownBattery(orgSlug, facilityId, fresh, memCache) {
  const key = batteryCacheKey(orgSlug, facilityId);
  const store = readPersistedStore();
  /** @type {BatteryCacheEntry} */
  let entry = { ...(memCache.get(key) || store[key] || {}) };

  const freshPercent =
    fresh.freshPercent != null && Number.isFinite(fresh.freshPercent) && fresh.freshPercent >= 0
      ? Math.round(fresh.freshPercent)
      : null;
  const freshVoltage =
    fresh.freshVoltage != null && Number.isFinite(fresh.freshVoltage) && fresh.freshVoltage > 0
      ? fresh.freshVoltage
      : null;

  if (freshPercent != null) {
    entry = { ...entry, percent: freshPercent, at: Date.now() };
    memCache.set(key, entry);
    store[key] = entry;
    writePersistedStore(store);
    return {
      voltage: Number.isFinite(entry.voltage) ? entry.voltage : null,
      batteryPercent: freshPercent,
      batteryCached: false,
      batterySource: 'gateway',
    };
  }

  if (freshVoltage != null) {
    entry = { ...entry, voltage: freshVoltage, at: Date.now() };
    memCache.set(key, entry);
    store[key] = entry;
    writePersistedStore(store);
    return {
      voltage: freshVoltage,
      batteryPercent: Number.isFinite(entry.percent) ? entry.percent : null,
      batteryCached: false,
      batterySource: 'heartbeat',
    };
  }

  const cached = validEntry(memCache.get(key)) || validEntry(store[key]);
  if (cached) {
    memCache.set(key, cached);
    if (Number.isFinite(cached.percent) && cached.percent >= 0) {
      return {
        voltage: Number.isFinite(cached.voltage) ? cached.voltage : null,
        batteryPercent: cached.percent,
        batteryCached: true,
        batterySource: 'gateway',
      };
    }
    if (Number.isFinite(cached.voltage) && cached.voltage > 0) {
      return {
        voltage: cached.voltage,
        batteryPercent: null,
        batteryCached: true,
        batterySource: 'heartbeat',
      };
    }
  }

  return {
    voltage: null,
    batteryPercent: null,
    batteryCached: false,
    batterySource: null,
  };
}

/** @deprecated resolveLastKnownBattery を使用 */
export function resolveLastKnownBatteryVoltage(orgSlug, facilityId, freshVoltage, memCache) {
  const r = resolveLastKnownBattery(orgSlug, facilityId, { freshVoltage }, memCache);
  return r.voltage;
}

export function peekLastKnownBatteryVoltage(orgSlug, facilityId, memCache) {
  return resolveLastKnownBattery(orgSlug, facilityId, {}, memCache).voltage;
}
