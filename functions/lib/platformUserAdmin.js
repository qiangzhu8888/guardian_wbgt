'use strict';

/**
 * プラットフォーム管理画面用（シークレットを含まない）
 * @param {string} id
 * @param {FirebaseFirestore.DocumentData | undefined} data
 */
function stripUserForPlatformList(id, data) {
  const d = data || {};
  return {
    userId: id,
    email: d.email != null ? String(d.email) : '',
    orgId: d.orgId != null ? String(d.orgId) : '',
    role: d.role != null ? String(d.role) : 'viewer',
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<number>}
 */
async function countSuperadmins(db) {
  const snap = await db.collection('users').get();
  let n = 0;
  snap.forEach((doc) => {
    if (doc.data().role === 'superadmin') n += 1;
  });
  return n;
}

module.exports = {
  stripUserForPlatformList,
  countSuperadmins,
};
