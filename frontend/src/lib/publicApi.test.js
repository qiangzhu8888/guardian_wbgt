import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildBuildicsProxyUrl,
  buildPublicConfigUrls,
  adminApiUrl,
  uploadAdminOrgLogo,
  switchAdminOrg,
} from './publicApi';

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

  it('uploadAdminOrgLogo posts raw file body', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, data: { logoUrl: 'https://storage.googleapis.com/b/x.png' } }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const file = new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' });
      const out = await uploadAdminOrgLogo('tok', file);
      expect(out._ok).toBe(true);
      expect(out.data?.logoUrl).toContain('storage.googleapis.com');
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/org-logo',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer tok', 'Content-Type': 'image/png' }),
        }),
      );
      const call = fetchMock.mock.calls[0];
      expect(call[1].body).toBe(file);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('switchAdminOrg posts JSON body with Bearer', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, accessToken: 'nt', user: { id: 'u', orgId: 'o2' } }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const out = await switchAdminOrg('tok', 'o2');
      expect(out._ok).toBe(true);
      expect(out.accessToken).toBe('nt');
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/switch-org',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer tok',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ orgId: 'o2' }),
        }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
