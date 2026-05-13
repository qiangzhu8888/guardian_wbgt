/** API・Firestore と同じ value */
export const FACILITY_VENUE_CATEGORIES = Object.freeze([
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

/** @type {{ value: string, label: string }[]} */
export const FACILITY_VENUE_CATEGORY_OPTIONS = [
  { value: 'unknown', label: '未設定' },
  { value: 'school', label: '学校（小・中・高校など）' },
  { value: 'university_college', label: '大学等' },
  { value: 'childcare', label: '保育園・幼稚園' },
  { value: 'hospital_clinic', label: '病院・診療所' },
  { value: 'factory', label: '工場' },
  { value: 'warehouse', label: '倉庫・物流施設' },
  { value: 'office', label: 'オフィス・事務所' },
  { value: 'retail_commercial', label: '店舗・商業施設' },
  { value: 'gym_stadium', label: '体育館・競技場' },
  { value: 'construction_site', label: '建設現場' },
  { value: 'farmland', label: '農地・屋外作業' },
  { value: 'housing_complex', label: '住宅・団地など' },
  { value: 'other', label: 'その他' },
];

/** @param {string | undefined} v */
export function facilityVenueCategoryLabel(v) {
  const opt = FACILITY_VENUE_CATEGORY_OPTIONS.find((o) => o.value === v);
  return opt ? opt.label : FACILITY_VENUE_CATEGORY_OPTIONS[0].label;
}
