'use strict';

const { isValidOrgSlug } = require('./orgResolve');

/** Firestore ドキュメント ID 用（URL スラッグと同系の安全な文字列） */
const ORG_ID_RE = /^[a-z0-9][a-z0-9_-]{0,62}$/;

/**
 * @param {unknown} id
 * @returns {boolean}
 */
function isValidOrgIdForDoc(id) {
  return typeof id === 'string' && ORG_ID_RE.test(id);
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} slug
 */
async function assertSlugAvailable(db, slug) {
  const q = await db.collection('orgs').where('slug', '==', slug).limit(1).get();
  if (!q.empty) {
    const err = new Error('slug_taken');
    err.httpStatus = 409;
    throw err;
  }
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {{ orgId: unknown, slug: unknown, name?: unknown }} input
 * @returns {Promise<{ orgId: string, slug: string }>}
 */
async function createOrgDocument(db, input) {
  const orgId = String(input.orgId || '').trim();
  if (!isValidOrgIdForDoc(orgId)) {
    const err = new Error('invalid_org_id');
    err.httpStatus = 400;
    throw err;
  }
  const slugNorm = String(input.slug || '')
    .trim()
    .toLowerCase();
  if (!isValidOrgSlug(slugNorm)) {
    const err = new Error('invalid_slug');
    err.httpStatus = 400;
    throw err;
  }
  await assertSlugAvailable(db, slugNorm);

  const ref = db.collection('orgs').doc(orgId);
  const cur = await ref.get();
  if (cur.exists) {
    const err = new Error('org_id_exists');
    err.httpStatus = 409;
    throw err;
  }

  const now = Date.now();
  /** @type {Record<string, unknown>} */
  const payload = {
    slug: slugNorm,
    disabled: false,
    createdAt: now,
    updatedAt: now,
  };
  if (input.name != null && String(input.name).trim()) {
    payload.name = String(input.name).trim().slice(0, 200);
  }
  await ref.set(payload);
  return { orgId, slug: slugNorm };
}

/**
 * @param {string} id
 * @param {FirebaseFirestore.DocumentData | undefined} data
 */
function stripOrgForList(id, data) {
  const d = data || {};
  return {
    orgId: id,
    slug: d.slug != null ? String(d.slug) : null,
    name: d.name != null ? String(d.name) : null,
    disabled: d.disabled === true,
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

const ERROR_MSG_JA = {
  invalid_org_id: '組織 ID の形式が不正です（小文字で先頭は英数字、1〜63 文字、記号は - と _ のみ）',
  invalid_slug:
    'URL スラッグの形式が不正です（小文字の a-z・数字・ハイフン、先頭は英数字、1〜63 文字）',
  slug_taken: 'この URL スラッグは既に使われています',
  org_id_exists: 'この組織 ID は既に存在します',
};

module.exports = {
  ORG_ID_RE,
  isValidOrgIdForDoc,
  createOrgDocument,
  stripOrgForList,
  ERROR_MSG_JA,
};
