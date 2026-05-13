'use strict';

const defaultOrgFallback = () => String(process.env.DEFAULT_ORG_ID || 'default').trim();

function asNonEmptyOrgId(raw) {
  const s = String(raw ?? '').trim();
  return s === '' ? null : s;
}

/**
 * @param {FirebaseFirestore.DocumentData | undefined} userDoc Firestore users doc data
 * @returns {string[]}
 */
function normalizeOrgIds(userDoc) {
  const d = userDoc || {};
  const primary = asNonEmptyOrgId(d.orgId);

  /** @type {unknown} */
  const raw = d.orgIds;
  const out = [];

  const pushUnique = (id) => {
    const sid = String(id ?? '').trim();
    if (!sid || out.includes(sid)) return;
    out.push(sid);
  };

  if (Array.isArray(raw)) {
    for (const x of raw) pushUnique(typeof x === 'string' ? x : x?.orgId ?? x?.id ?? null);
  }
  if (primary) pushUnique(primary);
  else if (!out.length) {
    pushUnique(defaultOrgFallback());
  }
  /** Current doc.orgId appears first when present */
  const cur = primary;
  if (!cur || !out.length) return out;
  const rest = out.filter((id) => id !== cur);
  return [cur, ...rest];
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string[]} ids unique org IDs
 */
async function assertOrgIdsExistInOrgs(db, ids) {
  for (const id of ids) {
    const snap = await db.collection('orgs').doc(String(id)).get();
    if (!snap.exists) {
      const err = new Error(`unknown org: ${id}`);
      err.httpStatus = 400;
      throw err;
    }
  }
}

/**
 * @param {FirebaseFirestore.DocumentData | undefined} userDoc
 * @param {string} targetOrgId
 * @param {{ isSuperadmin?: boolean }} opts
 */
function userMayAccessOrg(userDoc, targetOrgId, opts = {}) {
  const oid = String(targetOrgId || '').trim();
  if (!oid) return false;
  if (opts.isSuperadmin) return true;
  return normalizeOrgIds(userDoc).includes(oid);
}

/**
 * Ensures saved orgId stays inside orgIds; if absent, resets to stable first slot.
 *
 * @param {string[]} orgIdsNormalized
 * @param {string | undefined} preferredPrimary
 */
function syncPrimaryOrgWithList(orgIdsNormalized, preferredPrimary) {
  const list = [...orgIdsNormalized].filter(Boolean);
  if (!list.length) throw new Error('orgIds normalized empty');

  let primary = preferredPrimary ? String(preferredPrimary).trim() : '';
  if (!primary || !list.includes(primary)) {
    primary = list[0];
  }
  return { orgId: primary, orgIds: [primary, ...list.filter((id) => id !== primary)] };
}

module.exports = {
  normalizeOrgIds,
  assertOrgIdsExistInOrgs,
  assertOrgIdsValid: assertOrgIdsExistInOrgs,
  userMayAccessOrg,
  syncPrimaryOrgWithList,
};
