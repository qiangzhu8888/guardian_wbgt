'use strict';

const { calculateWBGT, getWBGTLevel } = require('../lib/wbgtIndoorEstimate');

describe('wbgtIndoorEstimate', () => {
  it('calculateWBGT matches frontend wbgt.test reference pattern', () => {
    const w = calculateWBGT(25.5, 60.2);
    expect(typeof w).toBe('number');
    expect(w).toBeGreaterThan(20);
    expect(w).toBeLessThan(35);
  });

  it('getWBGTLevel uses env ministry thresholds', () => {
    expect(getWBGTLevel(31)).toBe('危険');
    expect(getWBGTLevel(28)).toBe('厳重警戒');
    expect(getWBGTLevel(25)).toBe('警戒');
    expect(getWBGTLevel(21)).toBe('注意');
    expect(getWBGTLevel(20)).toBe('ほぼ安全');
  });
});
