/** localStorage キー: この日時までバナーを出さない（epoch ms） */
export const PWA_INSTALL_DISMISS_UNTIL_KEY = 'pwa-install-dismiss-until';

/** 閉じたあと再表示までの日数 */
export const PWA_INSTALL_DISMISS_DAYS = 30;

/**
 * @param {string} [ua]
 * @returns {boolean}
 */
export function isIosUserAgent(ua) {
  if (!ua || typeof ua !== 'string') return false;
  if (/iphone|ipod|ipad/i.test(ua)) return true;
  if (/macintosh/i.test(ua)) return false;
  return false;
}

/**
 * UA のみでは判定できない iPadOS（デスクトップモードMacintosh）も含める
 * @returns {boolean}
 */
export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (isIosUserAgent(ua)) return true;
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

/**
 * スタンドアロン（ホーム画面から起動）かどうか。クライアント専用。
 * @returns {boolean}
 */
export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
  } catch {
    /* ignore */
  }
  // iOS Safari ホーム追加
  if (typeof window.navigator !== 'undefined' && window.navigator.standalone === true) {
    return true;
  }
  return false;
}


/**
 * @returns {number | null} epoch ms まで非表示、過去なら null（再表示可）
 */
export function readDismissUntilMs() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PWA_INSTALL_DISMISS_UNTIL_KEY);
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return n > Date.now() ? n : null;
  } catch {
    return null;
  }
}

/**
 * @param {number} untilMs
 */
export function writeDismissUntilMs(untilMs) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PWA_INSTALL_DISMISS_UNTIL_KEY, String(untilMs));
  } catch {
    /* private mode 等 */
  }
}
