/** 公開監視ダッシュボードの BUILDICS 自動更新間隔（サーバー側と整合） */

export const MIN_ORG_POLLING_INTERVAL_MS = 60_000;
export const MAX_ORG_POLLING_INTERVAL_MS = 86_400_000;

/** @type {{ id: string, label: string, ms: number }[]} */
export const ORG_POLLING_PRESETS = [
  { id: '1m', label: '1分', ms: 60_000 },
  { id: '5m', label: '5分', ms: 300_000 },
  { id: '15m', label: '15分', ms: 900_000 },
  { id: '30m', label: '30分', ms: 1_800_000 },
  { id: '1h', label: '1時間', ms: 3_600_000 },
];

/**
 * @param {unknown} ms
 */
export function clampEffectivePollingIntervalMs(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return MIN_ORG_POLLING_INTERVAL_MS;
  return Math.min(
    MAX_ORG_POLLING_INTERVAL_MS,
    Math.max(MIN_ORG_POLLING_INTERVAL_MS, Math.round(n)),
  );
}

/**
 * @param {unknown} ms
 */
export function presetIdFromMs(ms) {
  const x = clampEffectivePollingIntervalMs(ms);
  const hit = ORG_POLLING_PRESETS.find((p) => p.ms === x);
  return hit ? hit.id : 'custom';
}

/**
 * @param {{ presetId: string, customMinutes: unknown }} opts
 */
export function msFromPollingForm({ presetId, customMinutes }) {
  if (presetId !== 'custom') {
    const p = ORG_POLLING_PRESETS.find((x) => x.id === presetId);
    return p ? p.ms : MIN_ORG_POLLING_INTERVAL_MS;
  }
  const m = Math.round(Number(customMinutes));
  const bounded = Math.min(1440, Math.max(1, Number.isFinite(m) ? m : 1));
  return bounded * 60_000;
}
