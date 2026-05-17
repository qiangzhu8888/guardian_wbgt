import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import ProductSpecsPage from './ProductSpecsPage';

describe('ProductSpecsPage', () => {
  it('温湿度センサー仕様ページに写真と主要指標テキストを含む', () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/specs">
        <ProductSpecsPage />
      </StaticRouter>,
    );
    expect(html).toContain('温湿度センサー仕様（参考）');
    expect(html).toContain('src="/images/L5.png"');
    expect(html).toContain('146mm × 110mm × 37mm');
    expect(html).toContain('LTE-M');
    expect(html).toContain('hardware-spec-0');
  });
});
