import {
  defaultOrgSlug,
  normalizeOrgSlugParam,
  publicConfigQueryString,
} from './orgRoute';

const STATIC_FALLBACK = '/config/facilities.json';

export function buildPublicConfigUrls(orgSlug) {
  const q = publicConfigQueryString(orgSlug);
  const bases = [];
  if (import.meta.env.DEV && import.meta.env.VITE_API_BASE) {
    bases.push(`${import.meta.env.VITE_API_BASE.replace(/\/$/, '')}/api/public/config?${q}`);
  }
  bases.push(`/api/public/config?${q}`);
  bases.push(STATIC_FALLBACK);
  return bases;
}

export function buildBuildicsProxyUrl(endpoint, orgSlug) {
  const slug = normalizeOrgSlugParam(orgSlug);
  const pathQ = `path=${encodeURIComponent(endpoint)}`;
  const orgQ = `orgSlug=${encodeURIComponent(slug)}`;
  if (import.meta.env.DEV && import.meta.env.VITE_BUILDICS_PROXY_URL) {
    const base = String(import.meta.env.VITE_BUILDICS_PROXY_URL).replace(/\/$/, '');
    return `${base}?${pathQ}&${orgQ}`;
  }
  return `/api/buildics?${pathQ}&${orgQ}`;
}

/** BFF パス（開発時は VITE_API_BASE を前置） */
export function adminApiUrl(path) {
  if (import.meta.env.DEV && import.meta.env.VITE_API_BASE) {
    return `${import.meta.env.VITE_API_BASE.replace(/\/$/, '')}${path}`;
  }
  return path;
}

/**
 * @param {string} accessToken
 * @returns {Promise<{ code: number, data?: object, msg?: string }>}
 */
export async function fetchAdminOrgSettings(accessToken) {
  const res = await fetch(adminApiUrl('/api/admin/org-settings'), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j = await res.json().catch(() => ({}));
  return { ...j, _ok: res.ok, _status: res.status };
}

/**
 * @param {string} accessToken
 * @param {Record<string, unknown>} body
 */
export async function patchAdminOrgSettings(accessToken, body) {
  const res = await fetch(adminApiUrl('/api/admin/org-settings'), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  return { ...j, _ok: res.ok, _status: res.status };
}

/**
 * @param {string} accessToken
 */
export async function fetchPlatformOrgs(accessToken) {
  const res = await fetch(adminApiUrl('/api/admin/platform/orgs'), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j = await res.json().catch(() => ({}));
  return { ...j, _ok: res.ok, _status: res.status };
}

/**
 * @param {string} accessToken
 * @param {{ orgId: string, slug: string, name?: string }} body
 */
export async function createPlatformOrg(accessToken, body) {
  const res = await fetch(adminApiUrl('/api/admin/platform/orgs'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  return { ...j, _ok: res.ok, _status: res.status };
}

/**
 * @param {string} accessToken
 * @param {{ email: string, password: string, orgId: string, role?: string }} body
 */
export async function createPlatformUser(accessToken, body) {
  const res = await fetch(adminApiUrl('/api/admin/platform/users'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  return { ...j, _ok: res.ok, _status: res.status };
}

export { defaultOrgSlug, normalizeOrgSlugParam, publicConfigQueryString };
