import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import MobileMonitorQrBlock from '../components/MobileMonitorQrBlock.jsx';

describe('MobileMonitorQrBlock', () => {
  it('QR にテナント監視パスが含まれる', () => {
    const html = renderToStaticMarkup(
      <MobileMonitorQrBlock orgSlug="school-a" variant="monitor" />,
    );
    expect(html).toContain('/tenant/school-a');
    expect(html.toLowerCase()).toContain('<svg');
  });

  it('layout=header でも QR がテナントパスを指す', () => {
    const html = renderToStaticMarkup(
      <MobileMonitorQrBlock orgSlug="school-a" variant="monitor" layout="header" compact />,
    );
    expect(html).toContain('/tenant/school-a');
    expect(html).toContain('スマホで開く');
  });
});
