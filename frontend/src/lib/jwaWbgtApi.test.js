import { describe, expect, it, vi } from 'vitest';
import { fetchJwaDailyForecast, fetchJwaHourlyForecast, postJwaHourlyForecastBatch } from './jwaWbgtApi';

describe('jwaWbgtApi', () => {
  it('fetchJwaHourlyForecast は JSON と ok を返す', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ source: 'jwa', data: [] }),
    });
    const r = await fetchJwaHourlyForecast(35, 139);
    expect(r.ok).toBe(true);
    expect(r.json.source).toBe('jwa');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/forecasts/hourly?lat=35&lon=139'));
  });

  it('エラー時は ok: false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ msg: '未設定' }),
    });
    const r = await fetchJwaHourlyForecast(35, 139);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(503);
    expect(r.msg).toBe('未設定');
  });

  it('fetchJwaDailyForecast は daily に lat/lon を付与', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ source: 'jwa' }),
    });
    const r = await fetchJwaDailyForecast(35.1, 139.2);
    expect(r.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/forecasts/daily?lat=35.1&lon=139.2'));
  });

  it('postJwaHourlyForecastBatch POSTs JSON body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1, ok: true, preview: [] }] }),
    });
    const r = await postJwaHourlyForecastBatch([{ id: 1, lat: 35, lng: 139 }]);
    expect(r.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/public/jwa-wbgt/forecasts/hourly/batch'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ facilities: [{ id: 1, lat: 35, lng: 139 }] }),
      }),
    );
  });
});
