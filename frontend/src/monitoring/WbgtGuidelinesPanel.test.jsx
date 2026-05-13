import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { WbgtGuidelinesPanel } from './WbgtGuidelinesPanel.jsx';

describe('WbgtGuidelinesPanel', () => {
  it('detail variant references guidelines and boundary note', () => {
    const html = renderToStaticMarkup(<WbgtGuidelinesPanel variant="detail" />);
    expect(html).toContain('WBGT 危険度基準');
    expect(html).toContain('危険 31℃以上');
    expect(html).toContain('21℃／25℃／28℃／31℃');
  });

  it('dashboard variant mentions LIVE badge', () => {
    const html = renderToStaticMarkup(<WbgtGuidelinesPanel variant="dashboard" />);
    expect(html).toContain('LIVE');
    expect(html).toContain('湿球温度');
  });
});
