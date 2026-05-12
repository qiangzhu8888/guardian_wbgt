import { describe, it, expect } from 'vitest';
import { mergeFacilities } from './mergeFacilities';

const mock = [
  { id: 2, name: 'B', level: '注意', wbgt: 22, isMock: true },
  { id: 1, name: 'A', level: '危険', wbgt: 32, isMock: true },
];
const maps = [
  { deviceId: '111111', facilityId: 1 },
  { deviceId: '222222', facilityId: 2 },
];

describe('mergeFacilities', () => {
  it('keeps mock when no live data', () => {
    const out = mergeFacilities({}, mock, maps);
    expect(out).toHaveLength(2);
    expect(out.every((f) => f.isMock)).toBe(true);
  });

  it('merges live over mock and sorts live before mock', () => {
    const sensorData = {
      1: {
        status: 'ok',
        wbgt: 30,
        level: '厳重警戒',
        temp: 31,
        humidity: 55,
        updatedStr: '10:00',
        history: [],
      },
    };
    const out = mergeFacilities(sensorData, mock, maps);
    const live = out.find((f) => f.id === 1);
    expect(live?.isLive).toBe(true);
    expect(live?.deviceId).toBe('111111');
    expect(out[0].isLive || out[0].isMock).toBe(true);
  });

  it('stale maps to 通信異常', () => {
    const sensorData = {
      2: { status: 'stale', wbgt: 28, level: '警戒', temp: 30, humidity: 50, updatedStr: '', history: [] },
    };
    const out = mergeFacilities(sensorData, mock, maps);
    const row = out.find((f) => f.id === 2);
    expect(row?.level).toBe('通信異常');
    expect(row?.isLive).toBe(true);
  });
});
