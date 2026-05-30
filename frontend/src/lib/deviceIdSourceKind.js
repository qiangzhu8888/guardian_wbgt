import facilitiesFallback from '../../public/config/facilities.json';
import { looksLikePlaceholderDeviceId } from './deviceIdPlaceholders';

/** @typedef {'demo' | 'live' | 'unknown'} DeviceIdSourceKind */
/** @typedef {'bundled' | 'placeholder' | 'no_buildics_data' | 'buildics_verified' | null} DeviceIdSourceReason */

const ADDITIONAL_KNOWN_DEMO_DEVICE_IDS = ['350976658106199'];

/**
 * @param {string[] | undefined} fromApi
 */
export function buildDemoDeviceIdSet(fromApi) {
  const fromConfig = (facilitiesFallback.deviceMappings || []).map((m) =>
    String(m.deviceId || '').trim(),
  );
  return new Set([...fromConfig, ...ADDITIONAL_KNOWN_DEMO_DEVICE_IDS, ...(fromApi || [])]);
}

/**
 * @param {string | undefined} deviceId
 * @param {Set<string>} demoIdSet
 * @param {{ buildicsHasLiveData?: boolean | null }} [opts]
 * @returns {{ kind: DeviceIdSourceKind, reason: DeviceIdSourceReason }}
 */
export function resolveDeviceIdSourceKind(deviceId, demoIdSet, opts = {}) {
  const id = String(deviceId || '').trim();
  if (!/^\d{6,24}$/.test(id)) {
    return { kind: 'unknown', reason: null };
  }
  if (demoIdSet.has(id)) {
    return { kind: 'demo', reason: 'bundled' };
  }
  if (looksLikePlaceholderDeviceId(id)) {
    return { kind: 'demo', reason: 'placeholder' };
  }
  const probed = opts.buildicsHasLiveData;
  if (probed === true) {
    return { kind: 'live', reason: 'buildics_verified' };
  }
  if (probed === false) {
    return { kind: 'demo', reason: 'no_buildics_data' };
  }
  return { kind: 'live', reason: null };
}

/**
 * @param {{ kind: DeviceIdSourceKind, reason: DeviceIdSourceReason } | DeviceIdSourceKind} resolved
 */
export function deviceIdSourceKindOnly(resolved) {
  return typeof resolved === 'string' ? resolved : resolved.kind;
}

/** @param {DeviceIdSourceReason} reason */
export function deviceSourceHint(reason, kind) {
  if (kind === 'demo' && reason === 'bundled') {
    return '同梱サンプルのデモ用 ID です。監視画面ではモック施設と組み合わせた参考表示になります。';
  }
  if (kind === 'demo' && reason === 'placeholder') {
    return 'テスト用・ダミーとみなせる ID のため、デモ扱いで表示します。';
  }
  if (kind === 'demo' && reason === 'no_buildics_data') {
    return 'BUILDICS に直近の実測が見つからないため、デモ扱いとします（実機 ID の誤入力の可能性があります）。';
  }
  if (kind === 'live' && reason === 'buildics_verified') {
    return 'BUILDICS で直近の実測データを確認しました。現場センサーとして扱います。';
  }
  if (kind === 'live') {
    return '形式は正しい ID です。登録前に BUILDICS 照会で実機か確認します。';
  }
  return '';
}

/** @type {Record<DeviceIdSourceKind, string>} */
export const DEVICE_SOURCE_SHORT_LABEL = {
  demo: 'デモ用',
  live: '現場センサー',
  unknown: '—',
};

/** @deprecated use resolveDeviceIdSourceKind */
export function getDeviceIdSourceKind(deviceId, demoIdSet, opts = {}) {
  return deviceIdSourceKindOnly(resolveDeviceIdSourceKind(deviceId, demoIdSet, opts));
}

/** @deprecated use deviceSourceHint(reason, kind) */
export const DEVICE_SOURCE_HINT = {
  demo: 'デモ用 ID として扱います（同梱サンプル・ダミー・BUILDICS 未検出）。',
  live: '現場センサー想定の ID です。',
  unknown: '',
};
