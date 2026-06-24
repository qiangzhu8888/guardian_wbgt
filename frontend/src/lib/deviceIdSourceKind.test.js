import { describe, it, expect } from 'vitest';
import {
  buildDemoDeviceIdSet,
  getDeviceIdSourceKind,
  resolveDeviceIdSourceKind,
  deviceIdSourceKindOnly,
} from './deviceIdSourceKind';

describe('deviceIdSourceKind', () => {
  it('does not treat bundled static fallback IDs as demo by default', () => {
    const set = buildDemoDeviceIdSet();
    expect(getDeviceIdSourceKind('350976658106130', set)).toBe('live');
  });

  it('marks explicit demo catalog IDs', () => {
    const set = buildDemoDeviceIdSet();
    expect(getDeviceIdSourceKind('350976658106199', set)).toBe('demo');
  });

  it('marks unknown-format IDs', () => {
    const set = buildDemoDeviceIdSet();
    expect(getDeviceIdSourceKind('12', set)).toBe('unknown');
  });

  it('marks placeholder numeric IDs as demo', () => {
    const set = buildDemoDeviceIdSet();
    expect(getDeviceIdSourceKind('111111111111', set)).toBe('demo');
  });

  it('keeps probed no-data IDs as live (unverified)', () => {
    const set = buildDemoDeviceIdSet();
    const r = resolveDeviceIdSourceKind('350976658199999', set, { buildicsHasLiveData: false });
    expect(deviceIdSourceKindOnly(r)).toBe('live');
    expect(r.reason).toBe('no_buildics_data');
  });

  it('marks probed live IDs as live', () => {
    const set = buildDemoDeviceIdSet();
    const r = resolveDeviceIdSourceKind('350976658199999', set, { buildicsHasLiveData: true });
    expect(deviceIdSourceKindOnly(r)).toBe('live');
  });

  it('overrides demo catalog when BUILDICS verifies data', () => {
    const set = buildDemoDeviceIdSet();
    const r = resolveDeviceIdSourceKind('350976658106199', set, { buildicsHasLiveData: true });
    expect(deviceIdSourceKindOnly(r)).toBe('live');
    expect(r.reason).toBe('buildics_verified');
  });

  it('merges API demoDeviceIds', () => {
    const set = buildDemoDeviceIdSet(['999888777666']);
    expect(getDeviceIdSourceKind('999888777666', set)).toBe('demo');
  });
});
