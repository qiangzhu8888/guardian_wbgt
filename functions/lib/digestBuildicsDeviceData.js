'use strict';

const { calculateWBGT, parseDataValue, getWBGTLevel, LEVEL_ORDER } = require('./wbgtSensorEvaluate');

/** @typedef {{ deviceId: string, facilityId: number }} DeviceMapping */

/**
 * @param {unknown[]} rawList BUILDICS `/common/device/queryDeviceData` の data 要素配列相当
 * @param {DeviceMapping[]} mappings 同一クエリ対象として送った mappings
 * @param {number} staleMs 「通信異常」判定までの許容時間
 * @returns {{ worstWbgt: number|null, worstLevel: string|null, worstFacilityId: number|null, hasStale: boolean }}
 */
function digestWorstFacilityHeat(rawList, mappings, staleMs) {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    return { worstWbgt: null, worstLevel: null, worstFacilityId: null, hasStale: false };
  }

  /** @type {number|null} */
  let worstOrdinal = null;
  let worstWbgt = /** @type {number|null} */ (null);
  let worstFacilityId = /** @type {number|null} */ (null);
  let worstLevelLabel = /** @type {string|null} */ (null);
  let hasStale = false;

  for (const mapping of mappings) {
    const deviceId = String(mapping.deviceId || '').trim();
    if (!deviceId) continue;
    const entries = rawList.filter((d) => String(d.deviceId || d.DeviceId || '').trim() === deviceId);
    if (entries.length === 0) continue;

    const sorted = [...entries].sort((a, b) => Number(a.latestDataTime || a.LatestDataTime) - Number(b.latestDataTime || b.LatestDataTime));

    /** @type {Array<{ wbgt: number, timeMs: number, level: string }>} */
    const history = [];

    for (const entry of sorted) {
      const parsed = parseDataValue(String(entry.dataValue || entry.DataValue || ''));
      if (!parsed) continue;
      const wbgt = calculateWBGT(parsed.temp, parsed.humidity);
      const lt = Number(entry.latestDataTime || entry.LatestDataTime);
      if (!Number.isFinite(lt)) continue;
      history.push({ wbgt, timeMs: lt, level: getWBGTLevel(wbgt) });
    }

    if (history.length === 0) continue;

    const latest = history[history.length - 1];
    const updatedAtMs = latest.timeMs;
    const stale = Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs > staleMs;

    let levelUsed = stale ? '通信異常' : latest.level;
    /** 通信異常は暑さよりもスコア上「マシ」側に倒れているため、ヒート・アラートの対象外にするため null とする */
    if (stale) {
      hasStale = true;
      continue;
    }

    /** 暑さのみ比較: worstOrdinal は LEVEL_ORDER が小さいほど悪化 */
    const ord = LEVEL_ORDER[levelUsed];
    if (!Number.isFinite(ord)) continue;

    if (worstOrdinal === null || ord < worstOrdinal) {
      worstOrdinal = ord;
      worstWbgt = latest.wbgt;
      worstFacilityId = Number(mapping.facilityId);
      worstLevelLabel = levelUsed;
    }
  }

  return {
    worstWbgt,
    worstLevel: worstLevelLabel,
    worstFacilityId,
    hasStale,
  };
}

module.exports = {
  digestWorstFacilityHeat,
};
