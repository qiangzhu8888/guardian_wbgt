'use strict';

const {
  calculateWBGT,
  parseDataValue,
  getWBGTLevel,
  levelMeetsMinimumThreshold,
} = require('../lib/wbgtSensorEvaluate');

describe('wbgtSensorEvaluate', () => {
  it('parse+calc+level が概ね整合', () => {
    /** 強い暑さ条件により WBGT が高くなる想定 */
    const wbgt = calculateWBGT(35, 80);
    expect(wbgt).toBeGreaterThan(30);
    expect(['危険', '厳重警戒']).toContain(getWBGTLevel(wbgt));
    expect(getWBGTLevel(29)).toBe('厳重警戒');
  });

  it('下限レベルを満たすか判定できる', () => {
    expect(levelMeetsMinimumThreshold('警戒', '厳重警戒')).toBe(false);
    expect(levelMeetsMinimumThreshold('厳重警戒', '警戒')).toBe(true);
  });

  it('parseDataValue', () => {
    expect(parseDataValue('30,70')).toEqual({ temp: 30, humidity: 70 });
    expect(parseDataValue(null)).toBe(null);
  });
});
