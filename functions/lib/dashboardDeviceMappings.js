'use strict';

/**
 * 同一 facilityId に複数デバイスがあるとき、ダッシュボード用に1件を選ぶ
 * @param {Array<{ deviceId: string, facilityId: number, dashboardDisplay?: boolean, updatedAt?: number, disabled?: boolean }>} devices
 * @returns {Array<{ deviceId: string, facilityId: number }>}
 */
function pickDashboardDeviceMappings(devices) {
  /** @type {Map<number, { deviceId: string, facilityId: number, dashboardDisplay: boolean, updatedAt: number }>} */
  const byFacility = new Map();

  for (const raw of devices || []) {
    if (raw.disabled === true) continue;
    const facilityId = Number(raw.facilityId);
    if (!Number.isFinite(facilityId)) continue;
    const deviceId = String(raw.deviceId || '').trim();
    if (!deviceId) continue;

    const entry = {
      deviceId,
      facilityId,
      dashboardDisplay: raw.dashboardDisplay === true,
      updatedAt: Number(raw.updatedAt) || 0,
    };
    const prev = byFacility.get(facilityId);
    if (!prev) {
      byFacility.set(facilityId, entry);
      continue;
    }
    byFacility.set(facilityId, pickPreferredDashboardEntry(prev, entry));
  }

  return [...byFacility.values()].map(({ deviceId, facilityId }) => ({ deviceId, facilityId }));
}

/**
 * @param {{ deviceId: string, facilityId: number, dashboardDisplay: boolean, updatedAt: number }} a
 * @param {{ deviceId: string, facilityId: number, dashboardDisplay: boolean, updatedAt: number }} b
 */
function pickPreferredDashboardEntry(a, b) {
  if (a.dashboardDisplay && !b.dashboardDisplay) return a;
  if (b.dashboardDisplay && !a.dashboardDisplay) return b;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt >= b.updatedAt ? a : b;
  return a.deviceId <= b.deviceId ? a : b;
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} orgId
 * @param {number} facilityId
 * @param {string} deviceId
 */
async function setExclusiveDashboardDisplay(db, orgId, facilityId, deviceId) {
  const fid = Number(facilityId);
  const did = String(deviceId || '').trim();
  const snap = await db.collection('devices').where('orgId', '==', orgId).get();
  const batch = db.batch();
  const now = Date.now();
  let found = false;

  snap.forEach((doc) => {
    const d = doc.data() || {};
    if (d.disabled === true) return;
    if (Number(d.facilityId) !== fid) return;
    const isChosen = doc.id === did;
    if (isChosen) found = true;
    batch.update(doc.ref, { dashboardDisplay: isChosen, updatedAt: now });
  });

  if (!found) {
    const err = new Error('device not at facility');
    err.code = 'NOT_FOUND';
    throw err;
  }
  await batch.commit();
}

/**
 * 地点にデバイスが1件だけ残る／追加されたときの既定（表示=ON）
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} orgId
 * @param {number} facilityId
 * @param {string} [exceptDeviceId]
 */
async function ensureDashboardDisplayIfLonely(db, orgId, facilityId, exceptDeviceId) {
  const fid = Number(facilityId);
  const snap = await db.collection('devices').where('orgId', '==', orgId).get();
  const active = [];
  snap.forEach((doc) => {
    if (exceptDeviceId && doc.id === exceptDeviceId) return;
    const d = doc.data() || {};
    if (d.disabled === true) return;
    if (Number(d.facilityId) !== fid) return;
    active.push(doc);
  });
  if (active.length !== 1) return;
  const only = active[0];
  if (only.data().dashboardDisplay === true) return;
  await only.ref.update({ dashboardDisplay: true, updatedAt: Date.now() });
}

module.exports = {
  pickDashboardDeviceMappings,
  pickPreferredDashboardEntry,
  setExclusiveDashboardDisplay,
  ensureDashboardDisplayIfLonely,
};
