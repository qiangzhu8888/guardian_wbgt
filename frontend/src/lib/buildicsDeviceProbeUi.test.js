import { describe, expect, it } from 'vitest';
import { describeBuildicsProbeUi } from './buildicsDeviceProbeUi';

describe('describeBuildicsProbeUi', () => {
  it('is idle for invalid id', () => {
    expect(describeBuildicsProbeUi({ deviceId: '12' }).status).toBe('idle');
  });

  it('shows loading while probing', () => {
    expect(describeBuildicsProbeUi({ deviceId: '350976658106130', probing: true }).status).toBe(
      'loading',
    );
  });

  it('shows found when BUILDICS has data', () => {
    const ui = describeBuildicsProbeUi({
      deviceId: '350976658106130',
      probe: { deviceId: '350976658106130', buildicsStatus: 'found' },
    });
    expect(ui.status).toBe('found');
    expect(ui.title).toContain('BUILDICS');
  });

  it('shows not_found when BUILDICS has no recent data', () => {
    const ui = describeBuildicsProbeUi({
      deviceId: '350976658106130',
      probe: { deviceId: '350976658106130', buildicsStatus: 'not_found' },
    });
    expect(ui.status).toBe('not_found');
  });
});
