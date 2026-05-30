'use strict';

const defaultPublicConfig = require('../defaults/publicConfig.json');

/** 公開設定の deviceMappings に無いがデモ／検証用の ID */
const ADDITIONAL_KNOWN_DEMO_DEVICE_IDS = ['350976658106199'];

/**
 * 同梱デモ・検証用として扱う deviceId 一覧（台帳 UI の種別表示用）
 * @returns {string[]}
 */
function getKnownDemoDeviceIds() {
  const fromConfig = (defaultPublicConfig.deviceMappings || []).map((m) =>
    String(m.deviceId || '').trim(),
  );
  const extraEnv = String(process.env.EXTRA_DEMO_DEVICE_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...fromConfig, ...ADDITIONAL_KNOWN_DEMO_DEVICE_IDS, ...extraEnv])];
}

module.exports = { getKnownDemoDeviceIds };
