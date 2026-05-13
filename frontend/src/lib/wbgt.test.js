import { describe, it, expect } from 'vitest';
import { calculateWBGT, getWBGTLevel, parseDataValue, WBGT_ENV_GUIDELINES } from './wbgt.js';

const e = 0.001;

describe('wbgt', () => {
  it('getWBGTLevel thresholds', () => {
    expect(getWBGTLevel(31)).toBe('危険');
    expect(getWBGTLevel(28)).toBe('厳重警戒');
    expect(getWBGTLevel(25)).toBe('警戒');
    expect(getWBGTLevel(21)).toBe('注意');
    expect(getWBGTLevel(20)).toBe('ほぼ安全');
  });

  it('getWBGTLevel boundary epsilons', () => {
    expect(getWBGTLevel(31 - e)).toBe('厳重警戒');
    expect(getWBGTLevel(31)).toBe('危険');
    expect(getWBGTLevel(28 - e)).toBe('警戒');
    expect(getWBGTLevel(28)).toBe('厳重警戒');
    expect(getWBGTLevel(25 - e)).toBe('注意');
    expect(getWBGTLevel(25)).toBe('警戒');
    expect(getWBGTLevel(21 - e)).toBe('ほぼ安全');
    expect(getWBGTLevel(21)).toBe('注意');
  });

  it('parseDataValue', () => {
    expect(parseDataValue('25.5,60.2')).toEqual({ temp: 25.5, humidity: 60.2 });
    expect(parseDataValue('')).toBe(null);
    expect(parseDataValue('x')).toBe(null);
  });

  it('calculateWBGT returns finite number', () => {
    const v = calculateWBGT(30, 60);
    expect(typeof v).toBe('number');
    expect(Number.isFinite(v)).toBe(true);
  });

  it('WBGT_ENV_GUIDELINES rows align with getWBGTLevel', () => {
    expect(WBGT_ENV_GUIDELINES).toHaveLength(5);
    const exemplars = [
      ['危険', 32],
      ['厳重警戒', 29],
      ['警戒', 26],
      ['注意', 22],
      ['ほぼ安全', 19],
    ];
    for (const [lvl, wbgt] of exemplars) {
      expect(getWBGTLevel(wbgt)).toBe(lvl);
    }
    for (const row of WBGT_ENV_GUIDELINES) {
      expect(row.badge).toMatch(/^(危険|厳重警戒|警戒|注意|ほぼ安全)$/);
      expect(typeof row.label).toBe('string');
    }
  });
});
