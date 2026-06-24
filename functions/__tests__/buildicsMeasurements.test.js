'use strict';

const {
  normalizeVoltageVolts,
  parseBuildicsRawJson,
  parseBuildicsDeviceEntry,
} = require('../lib/buildicsMeasurements');

const ALIVE_RAW =
  '{"msg":"alive","batt":4007,"temp":24.26,"hum":62.29}';

describe('buildicsMeasurements', () => {
  it('normalizeVoltageVolts batt mV', () => {
    expect(normalizeVoltageVolts(4007, 'mv')).toBe(4.007);
  });

  it('parseBuildicsRawJson alive batt', () => {
    expect(parseBuildicsRawJson(ALIVE_RAW)).toMatchObject({
      temp: 24.26,
      humidity: 62.29,
      voltage: 4.007,
    });
  });

  it('parseBuildicsDeviceEntry merges raw batt', () => {
    expect(
      parseBuildicsDeviceEntry({
        dataValue: '24.26,62.29',
        typeUnit: '℃,%',
        latestRawData: ALIVE_RAW,
      }),
    ).toMatchObject({ voltage: 4.007 });
  });
});
