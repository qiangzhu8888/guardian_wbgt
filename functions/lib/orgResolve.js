'use strict';

/** @see plan: URL セグメント用スラッグ（小文字想定、1〜63文字） */
const ORG_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

function defaultOrgId() {
  return process.env.DEFAULT_ORG_ID || 'default';
}

function defaultOrgSlug() {
  return String(process.env.DEFAULT_ORG_SLUG || 'default')
    .trim()
    .toLowerCase();
}

function isValidOrgSlug(slug) {
  return ORG_SLUG_RE.test(slug);
}

/**
 * @param {string | undefined | null} raw
 * @returns {string}
 */
function normalizeOrgSlugQuery(raw) {
  const defaultSlug = defaultOrgSlug();
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  return s || defaultSlug;
}

/**
 * 公開 API 用: クエリ orgSlug から orgId を解決する
 * @param {FirebaseFirestore.Firestore} db
 * @param {string | undefined} orgSlugQuery req.query.orgSlug
 * @returns {Promise<{ orgId: string, orgSlug: string }>}
 */
async function resolvePublicOrg(db, orgSlugQuery) {
  const slug = normalizeOrgSlugQuery(orgSlugQuery);
  if (!isValidOrgSlug(slug)) {
    const err = new Error('invalid org slug');
    err.httpStatus = 404;
    throw err;
  }

  const snap = await db.collection('orgs').where('slug', '==', slug).limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0];
    const data = doc.data() || {};
    if (data.disabled === true) {
      const err = new Error('org disabled');
      err.httpStatus = 404;
      throw err;
    }
    return { orgId: doc.id, orgSlug: slug };
  }

  const fallbackSlug = defaultOrgSlug();
  if (slug === fallbackSlug) {
    return { orgId: defaultOrgId(), orgSlug: slug };
  }

  const err = new Error('unknown org');
  err.httpStatus = 404;
  throw err;
}

/**
 * 台帳 orgId から公開パス用スラッグを解決する（管理ログイン・リンク用）
 * @param {FirebaseFirestore.Firestore} db
 * @param {string | undefined | null} orgId
 * @returns {Promise<string>}
 */
async function getOrgSlugForOrgId(db, orgId) {
  const id = String(orgId || '').trim() || defaultOrgId();
  try {
    const snap = await db.collection('orgs').doc(id).get();
    if (snap.exists) {
      const raw = snap.data()?.slug;
      if (typeof raw === 'string' && raw.trim()) {
        const s = String(raw).trim().toLowerCase();
        if (isValidOrgSlug(s)) return s;
      }
    }
  } catch (e) {
    console.error('getOrgSlugForOrgId', e);
  }
  if (id === defaultOrgId()) {
    return defaultOrgSlug();
  }
  const lower = id.toLowerCase();
  if (isValidOrgSlug(lower)) return lower;
  return defaultOrgSlug();
}

module.exports = {
  ORG_SLUG_RE,
  defaultOrgId,
  defaultOrgSlug,
  getOrgSlugForOrgId,
  isValidOrgSlug,
  normalizeOrgSlugQuery,
  resolvePublicOrg,
};
