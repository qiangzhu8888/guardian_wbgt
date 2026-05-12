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
  return `/o/${encodeURIComponent(normalizeOrgSlugParam(orgSlug))}`;
}
