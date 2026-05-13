'use strict';

/** 施設センサーの設置環境（AI・将来のモデル切替用メタデータ） */
const FACILITY_PLACEMENT_TYPES = Object.freeze([
  'unknown',
  'outdoor',
  'indoor',
  'semi_outdoor',
  'vehicle',
]);

const DEFAULT_PLACEMENT_TYPE = 'unknown';

/** @returns {readonly string[]} */
function listFacilityPlacementTypes() {
  return FACILITY_PLACEMENT_TYPES;
}

/**
 * Firestore に保存する値へ正規化（未指定は unknown）
 * @param {unknown} v
 * @returns {string}
 */
function toStoredFacilityPlacementType(v) {
  if (v === undefined || v === null || v === '') return DEFAULT_PLACEMENT_TYPE;
  const s = String(v).trim();
  return FACILITY_PLACEMENT_TYPES.includes(s) ? s : DEFAULT_PLACEMENT_TYPE;
}

/**
 * 入力検証（空はエラーなし → 既定で保存）。非空だが不正ならエラー用メッセージ
 * @param {unknown} v
 * @returns {string | null}
 */
function validateFacilityPlacementTypeInput(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (!FACILITY_PLACEMENT_TYPES.includes(s)) {
    return `設置区分は次のいずれかです: ${FACILITY_PLACEMENT_TYPES.join(', ')}`;
  }
  return null;
}

module.exports = {
  FACILITY_PLACEMENT_TYPES,
  DEFAULT_PLACEMENT_TYPE,
  listFacilityPlacementTypes,
  toStoredFacilityPlacementType,
  validateFacilityPlacementTypeInput,
};
