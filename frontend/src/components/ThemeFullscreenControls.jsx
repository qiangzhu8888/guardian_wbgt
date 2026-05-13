import { useThemeAndFullscreen } from '../hooks/useThemeAndFullscreen';

function IconMoon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function IconSun(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconExpand(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function IconShrink(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7" />
    </svg>
  );
}

/**
 * ダークモード切替・ブラウザ全画面切替
 * @param {{ variant?: 'monitor' | 'admin' | 'surface' }} props
 * - monitor: 監視ヘッダー上のゴーストボタン
 * - admin: 管理コンソールヘッダー
 * - surface: ログイン等の明るい背景
 */
export default function ThemeFullscreenControls({ variant = 'monitor' }) {
  const { isDark, toggleDarkMode, isFullscreen, toggleFullscreen } = useThemeAndFullscreen();

  const btnClass =
    variant === 'admin'
      ? 'btn-admin-toolbar min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2.5 sm:px-3'
      : variant === 'surface'
        ? 'inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white/95 text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100 p-2.5 min-h-[44px] min-w-[44px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors'
      : 'btn-ghost-header shrink-0 p-2.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-2';

  return (
    <>
      <button
        type="button"
        className={btnClass}
        onClick={toggleDarkMode}
        title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      >
        {isDark ? <IconSun /> : <IconMoon />}
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={toggleFullscreen}
        title={isFullscreen ? '全画面を終了' : '全画面表示'}
        aria-label={isFullscreen ? '全画面を終了' : '全画面表示'}
      >
        {isFullscreen ? <IconShrink /> : <IconExpand />}
      </button>
    </>
  );
}
