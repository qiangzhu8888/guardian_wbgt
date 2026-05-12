import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildBuildicsProxyUrl, buildPublicConfigUrls, adminApiUrl } from './publicApi';

describe('publicApi', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DEFAULT_ORG_SLUG', 'acme');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('buildBuildicsProxyUrl adds orgSlug', () => {
    const u = buildBuildicsProxyUrl('/common/device/queryDeviceData', 'school-a');
    expect(u).toContain('path=%2Fcommon%2Fdevice%2FqueryDeviceData');
    expect(u).toContain('orgSlug=school-a');
    expect(u.startsWith('/api/buildics')).toBe(true);
  });

  it('buildPublicConfigUrls includes tenant query on BFF URLs', () => {
    const urls = buildPublicConfigUrls('school-a');
    const apiUrls = urls.filter((u) => u.includes('/api/public/config'));
    expect(apiUrls.length).toBeGreaterThan(0);
    expect(apiUrls.every((u) => u.includes('orgSlug=school-a'))).toBe(true);
  });

  it('adminApiUrl keeps relative path when VITE_API_BASE unset', () => {
    vi.stubEnv('VITE_API_BASE', '');
    const u = adminApiUrl('/api/admin/org-settings');
    expect(u).toBe('/api/admin/org-settings');
  });
});
