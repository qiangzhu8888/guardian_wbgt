/** 監視ダッシュボード用アクセント色プリセット（組織設定 UI） */
export const DASHBOARD_THEME_PRESETS = Object.freeze([
  { label: 'スカイ', value: '#0EA5E9' },
  { label: 'ブルー', value: '#2563EB' },
  { label: 'インディゴ', value: '#4F46E5' },
  { label: 'ティール', value: '#0D9488' },
  { label: 'エメラルド', value: '#059669' },
  { label: 'アンバー', value: '#D97706' },
  { label: 'ローズ', value: '#E11D48' },
  { label: 'スレート', value: '#334155' },
]);

/**
 * type=color 用。未設定時はデフォルト見本色（保存は空のまま）。
 * @param {string} themePrimary
 * @param {string} [fallback='#0EA5E9']
 */
export function pickerHexFromTheme(themePrimary, fallback = '#0EA5E9') {
  const s = typeof themePrimary === 'string' ? themePrimary.trim() : '';
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toUpperCase();
  return fallback;
}

/**
 * @param {string} hex
 * @returns {string} 正規化（#RRGGBB）または空
 */
export function normalizeDashboardHex(hex) {
  const s = String(hex || '').trim();
  if (!s) return '';
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toUpperCase();
  return '';
}
