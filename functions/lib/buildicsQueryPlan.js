'use strict';

/**
 * @param {Array<{ deviceId: string, facilityId?: number }>} mappings
 * @param {number} nowMs
 * @param {number} historyHours
 * @param {number} chunkSize
 */
function buildQueryPlan(mappings, nowMs, historyHours, chunkSize) {
  if (!mappings?.length) {
    return { chunks: [], latestChunks: [], uniqueDeviceIds: [] };
  }
  const seen = new Set();
  const uniqueDeviceIds = [];
  for (const m of mappings) {
    const id = String(m.deviceId || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    uniqueDeviceIds.push(id);
  }
  const startTime = nowMs - historyHours * 60 * 60 * 1000;
  const endTime = nowMs;
  const flat = uniqueDeviceIds.map((deviceId) => ({ deviceId, startTime, endTime }));
  const chunks = [];
  const size = Math.max(1, chunkSize);
  for (let i = 0; i < flat.length; i += size) {
    chunks.push(flat.slice(i, i + size));
  }
  const latestChunks = buildLatestSnapshotChunks(uniqueDeviceIds, chunkSize);
  return { chunks, latestChunks, uniqueDeviceIds };
}

function buildLatestSnapshotChunks(uniqueDeviceIds, chunkSize) {
  if (!uniqueDeviceIds?.length) return [];
  const chunks = [];
  const size = Math.max(1, chunkSize);
  for (let i = 0; i < uniqueDeviceIds.length; i += size) {
    chunks.push(uniqueDeviceIds.slice(i, i + size).map((deviceId) => ({ deviceId })));
  }
  return chunks;
}

module.exports = { buildQueryPlan, buildLatestSnapshotChunks };
