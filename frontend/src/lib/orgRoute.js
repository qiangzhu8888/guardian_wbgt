/** @param {unknown} orgSlug URL セグメント（空ならデフォルト） */
export function defaultOrgSlug() {
  return String(import.meta.env.VITE_DEFAULT_ORG_SLUG || 'default')
    .trim()
    .toLowerCase();
}

export function normalizeOrgSlugParam(orgSlug) {
  const s = String(orgSlug ?? '').trim().toLowerCase();
  return s || defaultOrgSlug();
}

/** クエリ文字列（先頭の ? は付けない） */
export function publicConfigQueryString(orgSlug) {
  return `orgSlug=${encodeURIComponent(normalizeOrgSlugParam(orgSlug))}`;
}

export function monitorHomePath(orgSlug) {
  return `/tenant/${encodeURIComponent(normalizeOrgSlugParam(orgSlug))}`;
}

/**
 * テナント別・公開監視画面の絶対 URL（管理画面の案内表示用）。
 * `VITE_PUBLIC_APP_ORIGIN`（末尾スラッシュなし）があれば最優先。未設定時は `window.location.origin`。
 * @param {unknown} [orgSlug]
 */
export function publicOrgDashboardAbsoluteUrl(orgSlug) {
  const path = monitorHomePath(orgSlug);
  const configured = String(import.meta.env.VITE_PUBLIC_APP_ORIGIN || '')
    .trim()
    .replace(/\/$/, '');
  if (configured) return `${configured}${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}
