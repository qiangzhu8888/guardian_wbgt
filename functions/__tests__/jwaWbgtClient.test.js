'use strict';

const {
  parseLatLonQuery,
  formatPointSegment,
  rankToLevel,
  wbgtToCelsius,
  normalizeHourlyForecastBody,
  isJwaConfigured,
  getJwaAuthHeaders,
} = require('../lib/jwaWbgtClient');

describe('jwaWbgtClient', () => {
  test('parseLatLonQuery accepts lon alias', () => {
    expect(parseLatLonQuery({ lat: '35.68', lon: '139.76' })).toEqual({ lat: 35.68, lng: 139.76 });
    expect(parseLatLonQuery({ lat: 1, lng: 2 })).toEqual({ lat: 1, lng: 2 });
    expect(parseLatLonQuery({ lat: 'x', lng: 1 })).toBeNull();
    expect(parseLatLonQuery({ lat: 200, lng: 1 })).toBeNull();
  });

  test('formatPointSegment rounds', () => {
    expect(formatPointSegment(35.6894444, 139.6916666)).toBe('35.689444,139.691667');
  });

  test('rankToLevel matches SKILL.md', () => {
    expect(rankToLevel(0)).toBe('ほぼ安全');
    expect(rankToLevel(1)).toBe('注意');
    expect(rankToLevel(2)).toBe('警戒');
    expect(rankToLevel(3)).toBe('厳重警戒');
    expect(rankToLevel(4)).toBe('危険');
    expect(rankToLevel(null)).toBeNull();
    expect(rankToLevel(99)).toBeNull();
  });

  test('wbgtToCelsius interprets float and mis-scaled integers from JWA', () => {
    expect(wbgtToCelsius(null)).toBeNull();
    expect(wbgtToCelsius(285)).toBe(28.5);
    expect(wbgtToCelsius(210)).toBe(21);
    expect(wbgtToCelsius(21)).toBe(21);
    expect(wbgtToCelsius(28.5)).toBe(28.5);
    expect(wbgtToCelsius(13)).toBe(1.3);
  });

  test('normalizeHourlyForecastBody maps data', () => {
    const out = normalizeHourlyForecastBody({
      results: {
        mesh_code: '53394621',
        reference_time: '2025-06-20T10:00:00+09:00',
        data: [{ time: '2025-06-20T11:00:00+09:00', wbgt: 285, rank: 2 }],
      },
    });
    expect(out.error).toBeUndefined();
    expect(out.meshCode).toBe('53394621');
    expect(out.data[0].wbgtCelsius).toBe(28.5);
    expect(out.data[0].level).toBe('警戒');
  });

  test('isJwaConfigured false without env', () => {
    delete process.env.JWA_X_API_KEY;
    delete process.env.JWA_APIKEY;
    expect(isJwaConfigured()).toBe(false);
  });

  test('getJwaAuthHeaders strips one layer of wrapping quotes after trim', () => {
    const prevX = process.env.JWA_X_API_KEY;
    const prevK = process.env.JWA_APIKEY;
    process.env.JWA_X_API_KEY = '  "xa"  ';
    process.env.JWA_APIKEY = "'yb'";
    try {
      expect(isJwaConfigured()).toBe(true);
      const h = getJwaAuthHeaders();
      expect(h['X-api-key']).toBe('xa');
      expect(h.Apikey).toBe('yb');
    } finally {
      if (prevX === undefined) delete process.env.JWA_X_API_KEY;
      else process.env.JWA_X_API_KEY = prevX;
      if (prevK === undefined) delete process.env.JWA_APIKEY;
      else process.env.JWA_APIKEY = prevK;
    }
  });

  test('fetchHourlyForecastBatch returns previews per id', async () => {
    jest.resetModules();
    process.env.JWA_X_API_KEY = 'test-x';
    process.env.JWA_APIKEY = 'test-y';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          results: {
            mesh_code: '53394621',
            reference_time: '2025-06-20T10:00:00+09:00',
            data: [
              { time: '2025-06-20T11:00:00+09:00', wbgt: 285, rank: 2 },
              { time: '2025-06-20T12:00:00+09:00', wbgt: 300, rank: 3 },
            ],
          },
        }),
    });
    const { fetchHourlyForecastBatch } = require('../lib/jwaWbgtClient');
    const out = await fetchHourlyForecastBatch([{ id: 7, lat: 35.68, lng: 139.76 }]);
    expect(out).toHaveLength(1);
    expect(out[0].ok).toBe(true);
    expect(out[0].id).toBe(7);
    expect(out[0].meshCode).toBe('53394621');
    expect(out[0].preview).toHaveLength(2);
    expect(out[0].preview[0].wbgtCelsius).toBe(28.5);
    delete process.env.JWA_X_API_KEY;
    delete process.env.JWA_APIKEY;
    jest.resetModules();
  });

  test('fetchHourlyForecastBatch caps preview at 24 hourly points when API returns more', async () => {
    jest.resetModules();
    process.env.JWA_X_API_KEY = 'test-x';
    process.env.JWA_APIKEY = 'test-y';
    const data = Array.from({ length: 30 }, (_, i) => {
      const hourTotal = 11 + i;
      const d = Math.floor(hourTotal / 24);
      const h = hourTotal % 24;
      return {
        time: `2025-06-${String(20 + d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00+09:00`,
        wbgt: 250 + i,
        rank: 1,
      };
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          results: {
            mesh_code: '53394621',
            reference_time: '2025-06-20T10:00:00+09:00',
            data,
          },
        }),
    });
    const { fetchHourlyForecastBatch } = require('../lib/jwaWbgtClient');
    const out = await fetchHourlyForecastBatch([{ id: 99, lat: 35.68, lng: 139.76 }]);
    expect(out).toHaveLength(1);
    expect(out[0].ok).toBe(true);
    expect(out[0].preview).toHaveLength(24);
    delete process.env.JWA_X_API_KEY;
    delete process.env.JWA_APIKEY;
    jest.resetModules();
  });
});
