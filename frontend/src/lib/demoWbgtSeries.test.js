import { describe, it, expect } from 'vitest';
import { buildDemoJwaMeshPreview, buildDemoWbgtTrendForDetail } from './demoWbgtSeries';

describe('demoWbgtSeries', () => {
  it('buildDemoWbgtTrendForDetail は現在 WBGT で終端し、同一 seed で同順になる', () => {
    const a = buildDemoWbgtTrendForDetail({ currentWbgt: 28.5, seed: 42, hours: 6 });
    const b = buildDemoWbgtTrendForDetail({ currentWbgt: 28.5, seed: 42, hours: 6 });
    expect(a.length).toBeGreaterThan(3);
    expect(a[a.length - 1].wbgt).toBe(28.5);
    expect(a.map((x) => x.wbgt).join(',')).toBe(b.map((x) => x.wbgt).join(','));
  });

  it('無効な WBGT ではトレンドを返さない', () => {
    expect(buildDemoWbgtTrendForDetail({ currentWbgt: 0, seed: 1, hours: 6 })).toEqual([]);
  });

  it('buildDemoJwaMeshPreview は ISO 時刻と数値を付与する', () => {
    const p = buildDemoJwaMeshPreview({ currentWbgt: 30, seed: 7 });
    expect(p.length).toBeGreaterThan(4);
    expect(Number.isFinite(Date.parse(p[0].time))).toBe(true);
    expect(typeof p[p.length - 1].wbgtCelsius).toBe('number');
  });
});
