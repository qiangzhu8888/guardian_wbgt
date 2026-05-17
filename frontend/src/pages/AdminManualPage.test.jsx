import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AdminManualPage from './AdminManualPage.jsx';

describe('AdminManualPage', () => {
  it('documents public monitoring semantics (sensor vs JWA, dashboard vs detail)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdminManualPage />
      </MemoryRouter>
    );
    expect(html).toContain('現場センサーに基づく現在の WBGT（暑さ指数の推定値）');
    expect(html).toContain('日本気象協会（JWA）の 1km メッシュによる時別 WBGT 予測（参考）');
    expect(html).toContain('気象庁の地域ヒート注意情報はダッシュボードのカードには出しません');
    expect(html).toContain('下側'); // JWA は詳細で履歴の下
    expect(html).toContain('時間別（デモ・擬似データ・直近6時間）');
    expect(html).toContain('polling.intervalMs');
    expect(html).toContain('自動更新間隔をサーバー既定に戻す');
    expect(html).toContain('スマホで開く');
    expect(html).toContain('58px');
    expect(html).toContain('270px');
  });
});
