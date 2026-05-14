'use strict';

const { pickNearestHourlyRow, fetchLocationConditions } = require('../lib/locationConditions');

describe('locationConditions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('pickNearestHourlyRow chooses closest to nowMs', () => {
    const base = new Date('2025-06-20T12:00:00+09:00').getTime();
    const rows = [
      { time: '2025-06-20T10:00:00+09:00', wbgtCelsius: 26 },
      { time: '2025-06-20T12:00:00+09:00', wbgtCelsius: 28 },
      { time: '2025-06-20T15:00:00+09:00', wbgtCelsius: 30 },
    ];
    const p = pickNearestHourlyRow(rows, base);
    expect(p.wbgtCelsius).toBe(28);
  });

  test('fetchLocationConditions does not estimate WBGT when JWA off', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { time: '2025-06-20T12:00', temperature_2m: 30.2, relative_humidity_2m: 65 },
      }),
    });
    const jwaWbgt = { isJwaConfigured: () => false };
    const out = await fetchLocationConditions({ lat: 35.68, lng: 139.76, jwaWbgt });
    expect(out.tempCelsius).toBe(30.2);
    expect(out.humidityPercent).toBe(65);
    expect(out.wbgtSource).toBe('unavailable');
    expect(out.wbgtCelsius).toBeNull();
    expect(out.wbgtLevel).toBeNull();
    expect(out.jwaConfigured).toBe(false);
    expect(out.jwaMessage).toContain('未設定');
    expect(global.fetch).toHaveBeenCalled();
  });

  test('fetchLocationConditions returns JWA mesh WBGT when JWA returns data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { time: '2025-06-20T12:00', temperature_2m: 30, relative_humidity_2m: 50 },
      }),
    });
    const jwaWbgt = {
      isJwaConfigured: () => true,
      fetchHourlyForecastByPoint: jest.fn().mockResolvedValue({
        data: [
          { time: '2025-06-20T11:00:00+09:00', wbgtCelsius: 27.0, level: '注意' },
          { time: '2025-06-20T12:00:00+09:00', wbgtCelsius: 28.5, level: '警戒' },
        ],
      }),
    };
    const out = await fetchLocationConditions({ lat: 35.68, lng: 139.76, jwaWbgt });
    expect(out.wbgtSource).toBe('jwa');
    expect(out.wbgtCelsius).toBe(28.5);
    expect(out.wbgtLevel).toBe('警戒');
    expect(out.wbgtForecastTime).toContain('12:00:00');
    expect(out.jwaConfigured).toBe(true);
    expect(out.jwaMessage).toBeNull();
    expect(jwaWbgt.fetchHourlyForecastByPoint).toHaveBeenCalledWith(35.68, 139.76);
  });

  test('fetchLocationConditions sets jwaMessage when JWA fetch rejects with 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { time: '2025-06-20T12:00', temperature_2m: 30, relative_humidity_2m: 50 },
      }),
    });
    const err = new Error('JWA API 認証に失敗しました');
    err.code = 'upstream_http';
    err.status = 401;
    const jwaWbgt = {
      isJwaConfigured: () => true,
      fetchHourlyForecastByPoint: jest.fn().mockRejectedValue(err),
    };
    const out = await fetchLocationConditions({ lat: 35.68, lng: 139.76, jwaWbgt });
    expect(out.wbgtSource).toBe('unavailable');
    expect(out.jwaConfigured).toBe(true);
    expect(out.jwaMessage).toContain('認証');
  });
});
