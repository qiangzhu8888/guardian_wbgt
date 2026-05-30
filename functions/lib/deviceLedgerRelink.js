'use strict';

/**
 * 紐付け解除済み・無効の台帳行を、同じ deviceId で再登録できるか
 * @param {Record<string, unknown> | undefined} data
 */
function deviceLedgerAllowsRelink(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.disabled === true) return true;
  const fid = Number(data.facilityId);
  return !Number.isFinite(fid);
}

module.exports = { deviceLedgerAllowsRelink };
