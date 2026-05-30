import { describe, it, expect } from 'vitest';
import {
  buildDemoDeviceIdSet,
  getDeviceIdSourceKind,
  resolveDeviceIdSourceKind,
  deviceIdSourceKindOnly,
} from './deviceIdSourceKind';

describe('deviceIdSourceKind', () => {
  it('marks bundled demo IDs', () => {
    const set = buildDemoDeviceIdSet();
    expect(getDeviceIdSourceKind('350976658106130', set)).toBe('demo');
  });

  it('marks unknown-format IDs', () => {
    const set = buildDemoDeviceIdSet();
    expect(getDeviceIdSourceKind('12', set)).toBe('unknown');
  });

  it('marks placeholder numeric IDs as demo', () => {
    const set = buildDemoDeviceIdSet();
    expect(getDeviceIdSourceKind('111111111111', set)).toBe('demo');
  });

  it('marks probed no-data IDs as demo', () => {
    const set = buildDemoDeviceIdSet();
    const r = resolveDeviceIdSourceKind('350976658199999', set, { buildicsHasLiveData: false });
    expect(deviceIdSourceKindOnly(r)).toBe('demo');
  });

  it('marks probed live IDs as live', () => {
    const set = buildDemoDeviceIdSet();
    const r = resolveDeviceIdSourceKind('350976658199999', set, { buildicsHasLiveData: true });
    expect(deviceIdSourceKindOnly(r)).toBe('live');
  });

  it('merges API demoDeviceIds', () => {
    const set = buildDemoDeviceIdSet(['999888777666']);
    expect(getDeviceIdSourceKind('999888777666', set)).toBe('demo');
  });
});
