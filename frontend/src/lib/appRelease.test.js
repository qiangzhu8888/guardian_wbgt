import { describe, it, expect } from 'vitest';
import { getAppReleaseVersion } from './appRelease';

describe('appRelease', () => {
  it('getAppReleaseVersion matches vite-injected VERSION', () => {
    expect(getAppReleaseVersion()).toBe(__APP_VERSION__);
    expect(getAppReleaseVersion().length).toBeGreaterThan(0);
  });
});
