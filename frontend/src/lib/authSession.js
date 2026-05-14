import { adminApiUrl } from './publicApi';

/**
 * Refresh Cookie で accessToken を再取得（ログイン時と同じ BFF / 同一オリジン想定）
 * @returns {Promise<boolean>}
 */
export async function tryRefreshAdminAccess() {
  try {
    const res = await fetch(adminApiUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || typeof j.accessToken !== 'string') return false;
    sessionStorage.setItem('accessToken', j.accessToken);
    if (j.user && typeof j.user === 'object') {
      sessionStorage.setItem('authUser', JSON.stringify(j.user));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 管理 API 用 fetch。Bearer は付与し、401 のときは refresh を1回試してから再試行します。
 * `credentials: 'include'` でログイン時の refresh Cookie を送ります。
 * @param {string} path `/api/admin/...` 形式
 * @param {RequestInit} [init]
 */
export async function adminApiFetch(path, init = {}) {
  const run = () => {
    const headers = new Headers(init.headers ?? undefined);
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : '';
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(adminApiUrl(path), {
      ...init,
      credentials: 'include',
      headers,
    });
  };

  let res = await run();
  if (res.status === 401) {
    const refreshed = await tryRefreshAdminAccess();
    if (refreshed) res = await run();
  }
  return res;
}

/**
 * 管理ログイン後のユーザー情報（role 判定用）
 * @returns {{
 *   id: string,
 *   email: string,
 *   role: string,
 *   orgId: string,
 *   orgSlug?: string,
 *   orgIds?: string[],
 *   orgs?: Array<{ orgId: string, orgSlug: string }>
 * } | null}
 */
export function getAuthUser() {
  try {
    const raw = sessionStorage.getItem('authUser');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u && typeof u.id === 'string' && typeof u.role === 'string') return u;
    return null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('authUser');
}

/**
 * Refresh Cookie を BFF で無効化し、クライアントのセッションを消す。
 * 通信失敗時もローカルは必ずクリアする。
 */
export async function requestAdminLogout() {
  try {
    await fetch(adminApiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.error('admin logout request failed', e);
  }
  clearAuthSession();
}
