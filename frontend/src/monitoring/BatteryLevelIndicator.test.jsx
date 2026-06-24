import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BatteryLevelIndicator from './BatteryLevelIndicator.jsx';

describe('BatteryLevelIndicator', () => {
  it('renders compact badge with percent', () => {
    const html = renderToStaticMarkup(<BatteryLevelIndicator voltage={4.007} compact />);
    expect(html).toContain('約');
    expect(html).toContain('%');
    expect(html).toContain('🔋');
  });

  it('renders bar mode with voltage and progressbar role', () => {
    const html = renderToStaticMarkup(<BatteryLevelIndicator voltage={4.007} />);
    expect(html).toContain('電源（推定）');
    expect(html).toContain('4.007 V');
    expect(html).toContain('role="progressbar"');
  });

  it('renders bar mode with gateway percent without 約 prefix', () => {
    const html = renderToStaticMarkup(
      <BatteryLevelIndicator batteryPercent={60} source="gateway" />,
    );
    expect(html).toContain('60%');
    expect(html).not.toContain('約60%');
  });

  it('returns null when voltage and percent missing', () => {
    const html = renderToStaticMarkup(<BatteryLevelIndicator voltage={null} />);
    expect(html).toBe('');
  });
});
