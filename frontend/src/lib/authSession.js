import { adminApiUrl } from './publicApi';

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
