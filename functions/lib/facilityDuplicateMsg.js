'use strict';

/**
 * facilities/{facilityId} がドキュメント ID で一意のため、組織横断で ID が衝突します。
 * @param {string | undefined} existingOrgId 既存ドキュメントの orgId
 * @param {string} requestOrgId 登録しようとしているユーザーの orgId
 */
function facilityCreateConflictMessage(existingOrgId, requestOrgId) {
  const ex = existingOrgId != null ? String(existingOrgId) : '';
  const rq = String(requestOrgId || '');
  if (ex && ex === rq) {
    return 'この場所 ID は既にあなたの組織で登録されています。別の ID を指定してください。';
  }
  return 'この場所 ID はシステム内ですでに使われています（画面に一覧されていない別組織や過去データと番号が重複している可能性があります）。空いている別の番号を試してください。';
}

module.exports = { facilityCreateConflictMessage };
