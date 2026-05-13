'use strict';

/**
 * 監視対象となる「場所」の業態・種別（学校／病院／工場など。AI・分析用メタデータ）
 */
const FACILITY_VENUE_CATEGORIES = Object.freeze([
  'unknown',
  'school',
  'university_college',
  'childcare',
  'hospital_clinic',
  'factory',
  'warehouse',
  'office',
  'retail_commercial',
  'gym_stadium',
  'construction_site',
  'farmland',
  'housing_complex',
  'other',
]);

const DEFAULT_VENUE_CATEGORY = 'unknown';

/** @returns {readonly string[]} */
function listFacilityVenueCategories() {
  return FACILITY_VENUE_CATEGORIES;
}

/**
 * @param {unknown} v
 * @returns {string}
 */
function toStoredFacilityVenueCategory(v) {
  if (v === undefined || v === null || v === '') return DEFAULT_VENUE_CATEGORY;
  const s = String(v).trim();
  return FACILITY_VENUE_CATEGORIES.includes(s) ? s : DEFAULT_VENUE_CATEGORY;
}

/**
 * @param {unknown} v
 * @returns {string | null}
 */
function validateFacilityVenueCategoryInput(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (!FACILITY_VENUE_CATEGORIES.includes(s)) {
    return `場種（venueCategory）は次のいずれかです: ${FACILITY_VENUE_CATEGORIES.join(', ')}`;
  }
  return null;
}

module.exports = {
  FACILITY_VENUE_CATEGORIES,
  DEFAULT_VENUE_CATEGORY,
  listFacilityVenueCategories,
  toStoredFacilityVenueCategory,
  validateFacilityVenueCategoryInput,
};
