import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAuthSession, requestAdminLogout } from './authSession';

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
});
