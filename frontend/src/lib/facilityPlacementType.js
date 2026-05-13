/** サーバー側 `facilityPlacementType.js` と同じ value（公開設定経由で施設オブジェクトに含まれる） */
export const FACILITY_PLACEMENT_TYPES = Object.freeze([
  'unknown',
  'outdoor',
  'indoor',
  'semi_outdoor',
  'vehicle',
]);

/** @type {{ value: string, label: string }[]} */
export const FACILITY_PLACEMENT_OPTIONS = [
  { value: 'unknown', label: '未設定' },
  { value: 'outdoor', label: '屋外' },
  { value: 'indoor', label: '屋内' },
  { value: 'semi_outdoor', label: '半屋外' },
  { value: 'vehicle', label: '車両・移動式' },
];

/** @param {string | undefined} v */
export function facilityPlacementLabel(v) {
  const opt = FACILITY_PLACEMENT_OPTIONS.find((o) => o.value === v);
  return opt ? opt.label : FACILITY_PLACEMENT_OPTIONS[0].label;
}
