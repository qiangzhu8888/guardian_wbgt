'use strict';

const { looksLikePlaceholderDeviceId } = require('./deviceIdPlaceholders');
const { getKnownDemoDeviceIds } = require('./demoDeviceIds');

/**
 * @param {string} id
 * @param {Set<string> | string[] | undefined} knownDemoIds
 */
function isKnownDemoDeviceId(id, knownDemoIds) {
  const set =
    knownDemoIds instanceof Set
      ? knownDemoIds
      : new Set(knownDemoIds || getKnownDemoDeviceIds());
  return set.has(String(id || '').trim());
}

/**
 * @typedef {'demo' | 'live' | 'unknown'} DeviceIdSourceKind
 * @typedef {'bundled' | 'placeholder' | 'no_buildics_data' | 'buildics_verified' | null} DeviceIdSourceReason
 */

/**
 * @param {string | undefined} deviceId
 * @param {Set<string> | string[] | undefined} knownDemoIds
 * @param {{ buildicsHasLiveData?: boolean | null }} [opts]
 * @returns {{ kind: DeviceIdSourceKind, reason: DeviceIdSourceReason }}
 */
function resolveDeviceIdSourceKind(deviceId, knownDemoIds, opts = {}) {
  const id = String(deviceId || '').trim();
  if (!/^\d{6,24}$/.test(id)) {
    return { kind: 'unknown', reason: null };
  }

  if (isKnownDemoDeviceId(id, knownDemoIds)) {
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

/** @param {DeviceIdSourceKind} kind */
function deviceIdSourceKindOnly(resolved) {
  return typeof resolved === 'string' ? resolved : resolved.kind;
}

/** @deprecated use resolveDeviceIdSourceKind + deviceIdSourceKindOnly */
function deviceIdSourceKind(deviceId, knownDemoIds, opts) {
  return deviceIdSourceKindOnly(resolveDeviceIdSourceKind(deviceId, knownDemoIds, opts));
}

module.exports = {
  resolveDeviceIdSourceKind,
  deviceIdSourceKindOnly,
  deviceIdSourceKind,
  getKnownDemoDeviceIds,
  isKnownDemoDeviceId,
  looksLikePlaceholderDeviceId,
};
