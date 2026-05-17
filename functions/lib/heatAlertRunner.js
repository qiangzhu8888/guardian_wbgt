'use strict';

const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { buildQueryPlan } = require('./buildicsQueryPlan');
const { getBuildicsApiKeyForLedger } = require('./orgDashboardMerge');
const { digestWorstFacilityHeat } = require('./digestBuildicsDeviceData');
const { levelMeetsMinimumThreshold } = require('./wbgtSensorEvaluate');
const { shouldSendDedup } = require('./heatAlertDedup');

const BUILDICS_API_BASE = 'https://www.buildics.jp/api';

const DEFAULT_STALE_MINUTES = 10;
const DEFAULT_HISTORY_HOURS = 1;
const DEFAULT_CHUNK_SIZE = 40;
const DEFAULT_ALERT_MIN_LEVEL = '厳重警戒';
const DEFAULT_COOLDOWN_MS =
  Number.parseInt(String(process.env.HEAT_ALERT_COOLDOWN_MS || '2700000'), 10) || 45 * 60 * 1000;
const HEAT_ALERT_MAX_USERS = Number.parseInt(String(process.env.HEAT_ALERT_MAX_USERS || '800'), 10) || 800;

async function fetchBuildicsChunk(bodyChunk, apiKey) {
  const res = await fetch(`${BUILDICS_API_BASE}/common/device/queryDeviceData`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Apikey: apiKey,
      'X-Apikey-Encoding': 'base64',
    },
    body: JSON.stringify(bodyChunk),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`BUILDICS HTTP ${res.status}: ${txt.slice(0, 240)}`);
  }
  const json = await res.json();
  const code = json.code ?? json.Code;
  if (code !== 200) {
    throw new Error(String(json.msg ?? json.Msg ?? 'BUILDICS upstream error'));
  }
  const list = json.data ?? json.Data ?? [];
  return Array.isArray(list) ? list : [];
}

/**
 * org 単位で最も厳しい WBGT 推定状態を算出（BUILDICS に直接ヒット）。
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} orgId
 */
async function evaluateOrgWorstHeat(db, orgId) {
  const apiKey = await getBuildicsApiKeyForLedger(db, orgId);
  if (!apiKey) return null;

  const devSnap = await db.collection('devices').where('orgId', '==', orgId).get();
  /** @type {Array<{ deviceId: string, facilityId: number }>} */
  const mappings = [];
  for (const d of devSnap.docs) {
    const x = d.data() || {};
    if (x.disabled === true) continue;
    const fid = Number(x.facilityId);
    if (!Number.isFinite(fid)) continue;
    mappings.push({ deviceId: d.id, facilityId: fid });
  }
  if (mappings.length === 0) return null;

  const nowMs = Date.now();
  const { chunks } = buildQueryPlan(mappings, nowMs, DEFAULT_HISTORY_HOURS, DEFAULT_CHUNK_SIZE);
  let rawList = [];
  for (const chunk of chunks) {
    rawList = rawList.concat(await fetchBuildicsChunk(chunk, apiKey));
  }
  const staleMs = DEFAULT_STALE_MINUTES * 60 * 1000;
  return digestWorstFacilityHeat(rawList, mappings, staleMs);
}

/**
 * @returns {Promise<{ sent: number, skipped: number, errors: number }>}
 */
async function runHeatAlertsOnce() {
  const db = getFirestore();
  const usersSnap = await db.collection('users').limit(HEAT_ALERT_MAX_USERS).get();

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  const messaging = getMessaging();

  for (const doc of usersSnap.docs) {
    const u = doc.data() || {};
    const userId = doc.id;
    try {
      const orgId = String(u.orgId || '').trim();
      if (!orgId) {
        skipped += 1;
        continue;
      }

      const prefs =
        typeof u.notificationPrefs === 'object' && u.notificationPrefs ? u.notificationPrefs : {};
      if (prefs.enabled !== true) {
        skipped += 1;
        continue;
      }

      const pushTokens = Array.isArray(u.notificationPushTokens) ? u.notificationPushTokens : [];
      if (pushTokens.length === 0) {
        skipped += 1;
        continue;
      }

      const minLevel = String(prefs.minLevelForPush || DEFAULT_ALERT_MIN_LEVEL);

      const heat = await evaluateOrgWorstHeat(db, orgId);
      if (!heat || !heat.worstLevel) {
        await db
          .collection('users')
          .doc(userId)
          .update({
            [`heatAlertDedup.${orgId}`]: FieldValue.delete(),
          })
          .catch(() => {});
        skipped += 1;
        continue;
      }

      if (!levelMeetsMinimumThreshold(heat.worstLevel, minLevel)) {
        await db
          .collection('users')
          .doc(userId)
          .update({
            [`heatAlertDedup.${orgId}`]: FieldValue.delete(),
          })
          .catch(() => {});
        skipped += 1;
        continue;
      }

      const dedupMap =
        typeof u.heatAlertDedup === 'object' && u.heatAlertDedup ? { ...u.heatAlertDedup } : {};
      const prevOrgState = dedupMap[orgId];
      const { send: shouldSend, nextState } = shouldSendDedup(prevOrgState, heat.worstLevel, DEFAULT_COOLDOWN_MS);

      if (!shouldSend) {
        skipped += 1;
        continue;
      }

      const orgSlugSnap = await db.collection('orgs').doc(orgId).get();
      const slug = String(orgSlugSnap.data()?.slug || '').trim();

      /** @type {string[]} */
      const tokenStrings = [];
      for (const t of pushTokens) {
        if (!t || typeof t !== 'object') continue;
        const tok = String(t.token || '').trim();
        if (tok) tokenStrings.push(tok);
      }

      if (tokenStrings.length === 0) {
        skipped += 1;
        continue;
      }

      const title = '熱中症警戒（WBGT）';
      const wbgtLine =
        heat.worstWbgt != null ? `※現場センサー由来のおおよその推定値 ${heat.worstWbgt}℃。` : '';
      const body = [
        `運用下限（設定）より厳しい推定状態として「${heat.worstLevel}」です（下限: ${minLevel} と同等かそれ以上ひどい場合に通知）。`,
        wbgtLine,
      ]
        .filter(Boolean)
        .join('\n');

      const msg = /** @type {import('firebase-admin/messaging').MulticastMessage} */ ({
        tokens: tokenStrings.slice(0, 500),
        notification: {
          title,
          body,
        },
        data: {
          type: 'heat-alert',
          orgId,
          orgSlug: slug || '',
          wbgtWorstLevel: heat.worstLevel,
          wbgtApprox: heat.worstWbgt != null ? String(heat.worstWbgt) : '',
        },
      });

      await messaging.sendEachForMulticast(msg);

      dedupMap[orgId] = nextState;
      await db.collection('users').doc(userId).update({
        heatAlertDedup: dedupMap,
      });

      sent += tokenStrings.length;
    } catch (e) {
      errors += 1;
      console.error('heat alert failed for user', userId, e);
    }
  }

  return { sent, skipped, errors };
}

module.exports = {
  runHeatAlertsOnce,
  evaluateOrgWorstHeat,
};
