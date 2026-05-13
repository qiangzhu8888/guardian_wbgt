/** localStorage に 'dark' | 'light' がある場合は固定。無ければ OS の prefers-color-scheme に追従。 */
export const COLOR_SCHEME_STORAGE_KEY = 'wbgt-color-scheme-override';

/** @returns {'dark' | 'light' | null} */
export function getStoredOverride() {
  try {
    const v = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** document.documentElement の `dark` クラスを現在の設定に合わせる */
export function applyColorScheme() {
  const o = getStoredOverride();
  const dark = o != null ? o === 'dark' : systemPrefersDark();
  document.documentElement.classList.toggle('dark', dark);
}

/** ライト⇄ダークを切り替え（以降は OS 設定より保存値を優先） */
export function toggleColorScheme() {
  const currentlyDark = document.documentElement.classList.contains('dark');
  const next = currentlyDark ? 'light' : 'dark';
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  applyColorScheme();
}
