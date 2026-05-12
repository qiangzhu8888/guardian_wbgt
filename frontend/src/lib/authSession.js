/**
 * 管理ログイン後のユーザー情報（role 判定用）
 * @returns {{ id: string, email: string, role: string, orgId: string } | null}
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
