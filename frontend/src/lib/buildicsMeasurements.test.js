import { describe, it, expect } from 'vitest';
import {
  classifyBuildicsUnit,
  normalizeVoltageVolts,
  parseBuildicsMeasurements,
  parseBuildicsRawJson,
  parseBuildicsDeviceEntry,
  extractRawPayloadString,
  pickDeviceRawPayload,
  isAlivePayload,
  pickDeviceHeartbeatRaw,
  resolveDeviceVoltage,
  formatVoltageVolts,
} from './buildicsMeasurements.js';

const ALIVE_RAW =
  '{"msg":"alive","imei":"351034927572622","seq":1148,"utc":1782134111,"mac":"BC572905066F","batt":4007,"up":385893,"sub":[],"acc":{"x":12,"y":-20,"z":-980},"temp":24.26,"hum":62.29}';

describe('buildicsMeasurements', () => {
  it('classifyBuildicsUnit detects voltage v/V/mV without matching kW', () => {
    expect(classifyBuildicsUnit('V')).toBe('voltage');
    expect(classifyBuildicsUnit('v')).toBe('voltage');
    expect(classifyBuildicsUnit('mV')).toBe('voltage_mv');
    expect(classifyBuildicsUnit('kW')).toBe(null);
    expect(classifyBuildicsUnit('℃')).toBe('temp');
    expect(classifyBuildicsUnit('%')).toBe('humidity');
  });

  it('normalizeVoltageVolts converts batt mV to V', () => {
    expect(normalizeVoltageVolts(4007, 'mv')).toBe(4.007);
    expect(normalizeVoltageVolts(4007, '')).toBe(4.007);
    expect(normalizeVoltageVolts(3.7, 'v')).toBe(3.7);
  });

  it('parseBuildicsRawJson extracts temp, hum, batt from alive payload', () => {
    expect(parseBuildicsRawJson(ALIVE_RAW)).toEqual({
      temp: 24.26,
      humidity: 62.29,
      voltage: 4.007,
    });
  });

  it('parseBuildicsMeasurements with typeUnit V and mV', () => {
    expect(parseBuildicsMeasurements('25.5,60.2,3.7', '℃,%,V')).toEqual({
      temp: 25.5,
      humidity: 60.2,
      voltage: 3.7,
    });
    expect(parseBuildicsMeasurements('25.5,60.2,4007', '℃,%,mV')).toEqual({
      temp: 25.5,
      humidity: 60.2,
      voltage: 4.007,
    });
  });

  it('parseBuildicsDeviceEntry merges voltage from latestRawData when dataValue lacks V', () => {
    expect(
      parseBuildicsDeviceEntry({
        dataValue: '24.26,62.29',
        typeUnit: '℃,%',
        latestRawData: ALIVE_RAW,
      }),
    ).toEqual({
      temp: 24.26,
      humidity: 62.29,
      voltage: 4.007,
    });
  });

  it('parseBuildicsDeviceEntry can use raw JSON alone when dataValue empty', () => {
    expect(
      parseBuildicsDeviceEntry({
        dataValue: '',
        latestRawData: ALIVE_RAW,
      }),
    ).toEqual({
      temp: 24.26,
      humidity: 62.29,
      voltage: 4.007,
    });
  });

  it('formatVoltageVolts trims trailing zeros', () => {
    expect(formatVoltageVolts(4.007)).toBe('4.007');
    expect(formatVoltageVolts(3.7)).toBe('3.7');
  });

  it('pickDeviceRawPayload finds batt JSON on older history row when latest row has no raw', () => {
    const entries = [
      {
        latestDataTime: 2000,
        dataValue: '24.0,60.0',
        typeUnit: '℃,%',
      },
      {
        latestDataTime: 1000,
        dataValue: '23.0,58.0',
        typeUnit: '℃,%',
        latestRawData: ALIVE_RAW,
      },
    ];
    expect(pickDeviceRawPayload(entries)).toBe(ALIVE_RAW);
    expect(
      parseBuildicsDeviceEntry(
        { dataValue: '24.0,60.0', typeUnit: '℃,%' },
        pickDeviceRawPayload(entries),
      ),
    ).toEqual({
      temp: 24,
      humidity: 60,
      voltage: 4.007,
    });
  });

  it('extractRawPayloadString accepts rawData alias', () => {
    expect(extractRawPayloadString({ rawData: ALIVE_RAW })).toBe(ALIVE_RAW);
  });

  it('resolveDeviceVoltage uses heartbeat row while normal rows lack batt', () => {
    const normalRows = [
      { latestDataTime: 3000, dataValue: '25.0,60.0', typeUnit: '℃,%' },
      { latestDataTime: 2000, dataValue: '24.5,59.0', typeUnit: '℃,%' },
    ];
    const heartbeatRow = {
      latestDataTime: 1500,
      dataValue: '',
      latestRawData: ALIVE_RAW,
    };
    expect(isAlivePayload(ALIVE_RAW)).toBe(true);
    expect(resolveDeviceVoltage([...normalRows, heartbeatRow])).toBe(4.007);
    expect(resolveDeviceVoltage(normalRows)).toBe(null);
  });

  it('resolveDeviceVoltage prefers latest snapshot with alive JSON', () => {
    const history = [{ latestDataTime: 5000, dataValue: '26.0,61.0', typeUnit: '℃,%' }];
    const snapshot = {
      latestDataTime: 6000,
      dataValue: '26.1,61.2',
      typeUnit: '℃,%',
      latestRawData: ALIVE_RAW,
    };
    expect(resolveDeviceVoltage([...history, snapshot])).toBe(4.007);
  });
});
