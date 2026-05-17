import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DetailView } from './DetailView.jsx';

vi.mock('../hooks/useDarkClass.js', () => ({
  useDarkClass: () => false,
}));

vi.mock('../components/MobileMonitorQrBlock', () => ({
  default: () => null,
}));

vi.mock('./JwaWbgtReferencePanel.jsx', () => ({
  JwaWbgtReferencePanel: () => (
    <div data-testid="jwa-marker">付近の WBGT 予測（参考）モック</div>
  ),
}));

vi.mock('./JmaHeatAdvisoryPanel.jsx', () => ({
  JmaHeatAdvisoryPanel: () => <div data-testid="jma-marker">JMAモック</div>,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="recharts-responsive">{children}</div>,
  LineChart: ({ children }) => <div data-testid="recharts-linechart">{children}</div>,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));

function makeFacility(overrides = {}) {
  return {
    id: 'fac-1',
    name: 'テスト駐在所',
    level: '注意',
    wbgt: 26,
    temp: 28,
    humidity: 55,
    weather: '—',
    weatherIcon: '🌤',
    updated: '12:34',
    isMock: false,
    lat: 35.681,
    lng: 139.767,
    address: '東京都',
    installationPhotoUrl: 'https://example.com/photo.jpg',
    deviceId: '351234567890',
    history: [],
    ...overrides,
  };
}

describe('DetailView', () => {
  it('labels live WBGT as sensor-derived and shows sensor realtime wording', () => {
    const html = renderToStaticMarkup(
      <DetailView facility={makeFacility()} onBack={() => {}} />
    );
    expect(html).toContain('WBGT 暑さ指数（現場センサー推定）');
    expect(html).toContain('現場センサーのリアルタイムデータ');
  });

  it('labels mock demo WBGT row', () => {
    const html = renderToStaticMarkup(
      <DetailView facility={makeFacility({ isMock: true })} onBack={() => {}} />
    );
    expect(html).toContain('WBGT 暑さ指数（デモ）');
    expect(html).not.toContain('現場センサーのリアルタイムデータ');
  });

  it('shows synthetic WBGT trend for mock facility (chart + table headline)', () => {
    const html = renderToStaticMarkup(
      <DetailView facility={makeFacility({ isMock: true, wbgt: 26 })} onBack={() => {}} />
    );
    expect(html).toContain('data-testid="detail-hourly-heading"');
    expect(html).toContain('時間別（デモ・擬似データ・直近6時間）');
    expect(html).toContain('data-testid="recharts-linechart"');
  });

  it('renders installation photo below header with enlarged max-height class', () => {
    const html = renderToStaticMarkup(
      <DetailView facility={makeFacility()} onBack={() => {}} />
    );
    const photoIdx = html.indexOf('https://example.com/photo.jpg');
    expect(photoIdx).toBeGreaterThan(-1);
    expect(html.includes('max-h-[16.8rem]')).toBe(true);
  });

  it('places mocked JWA block after hourly history headline (past chart section)', () => {
    const html = renderToStaticMarkup(
      <DetailView facility={makeFacility()} onBack={() => {}} />
    );
    expect(html.includes('時間別履歴')).toBe(true);
    expect(html.includes('付近の WBGT 予測')).toBe(true);
    expect(html.indexOf('時間別履歴')).toBeLessThan(html.indexOf('付近の WBGT 予測'));
    expect(html.indexOf('付近の WBGT 予測')).toBeLessThan(html.indexOf('センサー情報'));
  });
});
