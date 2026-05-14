import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJmaHeatAdvisory, postJmaHeatAdvisoryBatch } from './jmaHeatAdvisoryApi.js';

describe('jmaHeatAdvisoryApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns json on 200', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ active: false, prefName: '東京都' }),
    });
    const r = await fetchJmaHeatAdvisory(35.68, 139.76);
    expect(r.ok).toBe(true);
    expect(r.json.prefName).toBe('東京都');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/api/public/jma-wbgt/advisory');
    expect(url).toContain('lat=35.68');
    expect(url).toContain('lon=139.76');
  });

  it('returns error shape on failure', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ msg: '逆ジオ失敗' }),
    });
    const r = await fetchJmaHeatAdvisory(0, 0);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
    expect(r.msg).toBe('逆ジオ失敗');
  });

  it('postJmaHeatAdvisoryBatch POSTs facilities', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1, ok: true, active: false, prefName: '東京都' }] }),
    });
    const r = await postJmaHeatAdvisoryBatch([{ id: 1, lat: 35, lng: 139 }]);
    expect(r.ok).toBe(true);
    expect(r.json.results).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/public/jma-wbgt/advisory/batch'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilities: [{ id: 1, lat: 35, lng: 139 }] }),
      }),
    );
  });
});
