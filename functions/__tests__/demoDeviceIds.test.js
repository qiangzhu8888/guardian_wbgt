'use strict';

const { getKnownDemoDeviceIds } = require('../lib/demoDeviceIds');
const {
  deviceIdSourceKind,
  isKnownDemoDeviceId,
  resolveDeviceIdSourceKind,
} = require('../lib/deviceIdSourceKind');
const { looksLikePlaceholderDeviceId } = require('../lib/deviceIdPlaceholders');

describe('demoDeviceIds', () => {
  it('includes explicit demo catalog IDs only', () => {
    const ids = getKnownDemoDeviceIds();
    expect(ids).toContain('350976658106199');
    expect(ids).not.toContain('350976658106130');
  });

  it('classifies demo vs live', () => {
    const set = new Set(getKnownDemoDeviceIds());
    expect(deviceIdSourceKind('350976658106199', set)).toBe('demo');
    expect(deviceIdSourceKind('350976658106130', set)).toBe('live');
    expect(deviceIdSourceKind('350976658199999', set)).toBe('live');
    expect(deviceIdSourceKind('abc', set)).toBe('unknown');
  });

  it('isKnownDemoDeviceId', () => {
    expect(isKnownDemoDeviceId('350976658106199')).toBe(true);
    expect(isKnownDemoDeviceId('350976658106131')).toBe(false);
    expect(isKnownDemoDeviceId('123456789012')).toBe(false);
  });

  it('treats placeholder IDs as demo', () => {
    const set = new Set(getKnownDemoDeviceIds());
    expect(looksLikePlaceholderDeviceId('111111111111')).toBe(true);
    expect(deviceIdSourceKind('111111111111', set)).toBe('demo');
  });

  it('treats no BUILDICS data as live when probed', () => {
    const set = new Set(getKnownDemoDeviceIds());
    const r = resolveDeviceIdSourceKind('350976658199999', set, {
      buildicsHasLiveData: false,
    });
    expect(r.kind).toBe('live');
    expect(r.reason).toBe('no_buildics_data');
  });
});
