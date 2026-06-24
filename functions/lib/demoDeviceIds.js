'use strict';

/** 検証・サンプル専用（静的フォールバックの deviceMappings とは別） */
const ADDITIONAL_KNOWN_DEMO_DEVICE_IDS = ['350976658106199'];

/**
 * 管理画面で「デモ用」と明示する deviceId 一覧。
 * 静的 facilities.json の ID は実機でも使われ得るため含めない。
 * @returns {string[]}
 */
function getKnownDemoDeviceIds() {
  const extraEnv = String(process.env.EXTRA_DEMO_DEVICE_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...ADDITIONAL_KNOWN_DEMO_DEVICE_IDS, ...extraEnv])];
}

module.exports = { getKnownDemoDeviceIds };
