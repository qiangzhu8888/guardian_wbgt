import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import ProductLandingPage from './ProductLandingPage';

describe('ProductLandingPage', () => {
  it('ヒーローにダッシュボード画面イメージを掲載する', () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/">
        <ProductLandingPage />
      </StaticRouter>,
    );
    expect(html).toContain('src="/images/dashboard.png"');
    expect(html).toContain('監視ダッシュボードの画面例');
    expect(html).toContain('一覧表示イメージ');
    expect(html).toContain('id="lp-main-content"');
    expect(html).toContain('メインコンテンツへスキップ');
    expect(html).toContain('id="lp-features"');
    expect(html).toContain('デモ画面');
  });
});
