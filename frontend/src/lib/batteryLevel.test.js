import { describe, it, expect } from 'vitest';
import {
  estimateBatteryLevel,
  batteryLevelFromPercent,
  resolveBatteryDisplayLevel,
  BATTERY_VOLTAGE_FULL,
  BATTERY_VOLTAGE_EMPTY,
  BATTERY_VOLTAGE_WARN,
  BATTERY_VOLTAGE_OK,
} from './batteryLevel.js';

describe('batteryLevel', () => {
  it('estimateBatteryLevel maps 4.007V to high percent (ok)', () => {
    const r = estimateBatteryLevel(4.007);
    expect(r).not.toBeNull();
    expect(r.percent).toBeGreaterThanOrEqual(75);
    expect(r.band).toBe('ok');
    expect(r.label).toBe('十分');
  });

  it('estimateBatteryLevel full and empty bounds', () => {
    expect(estimateBatteryLevel(BATTERY_VOLTAGE_FULL)?.percent).toBe(100);
    expect(estimateBatteryLevel(BATTERY_VOLTAGE_EMPTY)?.percent).toBe(0);
  });

  it('estimateBatteryLevel warn and critical bands', () => {
    expect(estimateBatteryLevel(BATTERY_VOLTAGE_OK - 0.1)?.band).toBe('warn');
    expect(estimateBatteryLevel(BATTERY_VOLTAGE_WARN - 0.1)?.band).toBe('critical');
  });

  it('estimateBatteryLevel returns null for invalid', () => {
    expect(estimateBatteryLevel(null)).toBeNull();
    expect(estimateBatteryLevel(NaN)).toBeNull();
  });

  it('batteryLevelFromPercent maps gateway percent bands', () => {
    expect(batteryLevelFromPercent(60)?.band).toBe('ok');
    expect(batteryLevelFromPercent(30)?.band).toBe('warn');
    expect(batteryLevelFromPercent(10)?.band).toBe('critical');
  });

  it('resolveBatteryDisplayLevel prefers batteryPercent', () => {
    expect(resolveBatteryDisplayLevel({ batteryPercent: 60, voltage: 3.5 })?.percent).toBe(60);
    expect(resolveBatteryDisplayLevel({ voltage: 4.007 })?.percent).toBeGreaterThan(50);
  });
});
