import { describe, it, expect } from 'vitest';
import {
  buildJwaChartRowsWithPastFutureSplit,
  buildJwaDashboardPreviewSeries,
  pickJwaChartXTicks,
  wbgtChartYDomain,
  wbgtYReferenceBandAreas,
} from './jwaDashboardPreviewSeries.js';

describe('jwaDashboardPreviewSeries', () => {
  it('filters invalid and sorts by time', () => {
    const iso1 = '2026-05-14T00:00:00+09:00';
    const iso2 = '2026-05-14T01:00:00+09:00';
    const s = buildJwaDashboardPreviewSeries([
      { time: iso2, wbgtCelsius: 18 },
      { time: null, wbgtCelsius: 99 },
      { time: iso1, wbgtCelsius: 16 },
    ]);
    expect(s.length).toBe(2);
    expect(s[0].wbgt).toBe(16);
    expect(s[1].wbgt).toBe(18);
    expect(s[0].level).toBe('ほぼ安全');
    expect(s[1].level).toBe('ほぼ安全');
    expect(s[0].ts).toBeLessThan(s[1].ts);
  });

  it('wbgtChartYDomain pads min/max', () => {
    expect(wbgtChartYDomain([])).toEqual([0, 10]);
    expect(wbgtChartYDomain([{ wbgt: 21.5 }, { wbgt: 24 }])).toEqual([20, 25]);
  });

  it('wbgtYReferenceBandAreas clips to y range', () => {
    const a = wbgtYReferenceBandAreas(20, 32, 'light');
    expect(a.some((x) => x.y1 <= 21 && x.y2 >= 21)).toBe(true);
    expect(a[0].y1).toBe(20);
    expect(a[a.length - 1].y2).toBe(32);
  });

  it('pickJwaChartXTicks caps tick count', () => {
    const ts = Array.from({ length: 24 }, (_, i) => i * 3600_000);
    expect(pickJwaChartXTicks(ts, 5).length).toBeLessThanOrEqual(7);
  });
});

describe('buildJwaChartRowsWithPastFutureSplit', () => {
  it('splits at now for mixed past/future', () => {
    const t0 = Date.parse('2026-05-14T08:00:00+09:00');
    const t1 = Date.parse('2026-05-14T09:00:00+09:00');
    const t2 = Date.parse('2026-05-14T10:00:00+09:00');
    const pts = [
      { wbgt: 20, ts: t0 },
      { wbgt: 22, ts: t1 },
      { wbgt: 24, ts: t2 },
    ];
    const nowMs = Date.parse('2026-05-14T09:30:00+09:00');
    const { rows, allPast, allFuture } = buildJwaChartRowsWithPastFutureSplit(pts, nowMs);
    expect(allPast).toBe(false);
    expect(allFuture).toBe(false);
    expect(rows[0].wbgtSolid).toBe(20);
    expect(rows[0].wbgtForecast).toBeNull();
    expect(rows[1].wbgtSolid).toBe(22);
    expect(rows[1].wbgtForecast).toBe(22);
    expect(rows[2].wbgtSolid).toBeNull();
    expect(rows[2].wbgtForecast).toBe(24);
  });
});
