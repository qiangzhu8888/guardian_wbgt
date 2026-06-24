import { describe, it, expect, beforeEach } from 'vitest';
import { batteryCacheKey, resolveLastKnownBattery } from './lastKnownBattery.js';

describe('lastKnownBattery', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('batteryCacheKey scopes by org and facility', () => {
    expect(batteryCacheKey('school-a', 1)).toBe('school-a:1');
  });

  it('prefers fresh gateway percent over heartbeat voltage', () => {
    const mem = new Map();
    resolveLastKnownBattery('org', 2, { freshVoltage: 4.007 }, mem);
    const r = resolveLastKnownBattery('org', 2, { freshPercent: 60 }, mem);
    expect(r.batteryPercent).toBe(60);
    expect(r.batterySource).toBe('gateway');
    expect(r.batteryCached).toBe(false);
  });

  it('falls back to cached percent when gateway miss', () => {
    const mem = new Map();
    resolveLastKnownBattery('org', 3, { freshPercent: 55 }, mem);
    const r = resolveLastKnownBattery('org', 3, {}, mem);
    expect(r.batteryPercent).toBe(55);
    expect(r.batteryCached).toBe(true);
    expect(r.batterySource).toBe('gateway');
  });

  it('stores heartbeat voltage when no gateway percent', () => {
    const mem = new Map();
    const r = resolveLastKnownBattery('org', 4, { freshVoltage: 3.9 }, mem);
    expect(r.voltage).toBe(3.9);
    expect(r.batterySource).toBe('heartbeat');
  });

  it('restores from sessionStorage when memory cache empty', () => {
    const memA = new Map();
    resolveLastKnownBattery('org', 5, { freshPercent: 70 }, memA);

    const memB = new Map();
    const r = resolveLastKnownBattery('org', 5, {}, memB);
    expect(r.batteryPercent).toBe(70);
  });
});
