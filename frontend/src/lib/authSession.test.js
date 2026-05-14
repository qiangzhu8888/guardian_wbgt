import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adminApiFetch,
  clearAuthSession,
  requestAdminLogout,
  tryRefreshAdminAccess,
} from './authSession';

describe('authSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('requestAdminLogout clears session after fetch', async () => {
    sessionStorage.setItem('accessToken', 't');
    sessionStorage.setItem('authUser', JSON.stringify({ id: '1', role: 'admin' }));
    await requestAdminLogout();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('authUser')).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/logout'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('requestAdminLogout clears session even if fetch fails', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))));
    sessionStorage.setItem('accessToken', 't');
    await requestAdminLogout();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    errSpy.mockRestore();
  });

  it('clearAuthSession removes keys', () => {
    sessionStorage.setItem('accessToken', 'x');
    sessionStorage.setItem('authUser', '{}');
    clearAuthSession();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });

  it('tryRefreshAdminAccess saves token on 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ accessToken: 'new', user: { id: 'u1', role: 'admin' } }),
        }),
      ),
    );
    const ok = await tryRefreshAdminAccess();
    expect(ok).toBe(true);
    expect(sessionStorage.getItem('accessToken')).toBe('new');
  });

  it('adminApiFetch retries after 401 when refresh succeeds', async () => {
    sessionStorage.setItem('accessToken', 'expired');
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        n += 1;
        if (n === 1) {
          return Promise.resolve({ status: 401, ok: false, json: async () => ({}) });
        }
        if (n === 2) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ accessToken: 'fresh', user: { id: 'u', role: 'admin' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ code: 200, data: [] }),
        });
      }),
    );
    const res = await adminApiFetch('/api/admin/facilities');
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
