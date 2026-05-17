import { describe, it, expect } from 'vitest';
import {
  clampEffectivePollingIntervalMs,
  presetIdFromMs,
  msFromPollingForm,
  ORG_POLLING_PRESETS,
} from './orgPollingSettings';

describe('orgPollingSettings', () => {
  it('clampEffectivePollingIntervalMs enforces min/max', () => {
    expect(clampEffectivePollingIntervalMs(30_000)).toBe(60_000);
    expect(clampEffectivePollingIntervalMs(NaN)).toBe(60_000);
    expect(clampEffectivePollingIntervalMs(100_000_000)).toBe(86_400_000);
    expect(clampEffectivePollingIntervalMs(300_000)).toBe(300_000);
  });

  it('presetIdFromMs maps presets', () => {
    expect(presetIdFromMs(60_000)).toBe('1m');
    expect(presetIdFromMs(3_600_000)).toBe('1h');
    expect(presetIdFromMs(123_456)).toBe('custom');
  });

  it('msFromPollingForm respects presets', () => {
    for (const p of ORG_POLLING_PRESETS) {
      expect(msFromPollingForm({ presetId: p.id, customMinutes: 99 })).toBe(p.ms);
    }
  });

  it('msFromPollingForm custom uses whole minutes clamped 1–1440', () => {
    expect(msFromPollingForm({ presetId: 'custom', customMinutes: 2 })).toBe(120_000);
    expect(msFromPollingForm({ presetId: 'custom', customMinutes: 0 })).toBe(60_000);
    expect(msFromPollingForm({ presetId: 'custom', customMinutes: 9999 })).toBe(1440 * 60_000);
  });
});
