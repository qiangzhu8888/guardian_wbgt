import { Link } from 'react-router-dom';
import ThemeFullscreenControls from './ThemeFullscreenControls';
import { APP_DISPLAY_NAME, DEFAULT_APP_LOGO_URL, PRODUCTION_COMPANY_NAME } from '../lib/appBranding';
import { getAppReleaseVersion } from '../lib/appRelease';
import {
  productLandingCtaPaths,
  PRODUCT_LANDING_PATH,
  TERMS_PATH,
  PRIVACY_PATH,
  SLIDES_PATH,
} from '../lib/productLandingCta';

const changelogPath = '/changelog';
const manualPath = '/manual';

/**
 * 公開ドキュメント系ページの共通シェル
 * @param {{ title: string, description?: string, children: import('react').ReactNode }} props
 */
export default function PublicDocsLayout({ title, description, children }) {
  const { monitorPath, adminLoginPath } = productLandingCtaPaths();
  const version = getAppReleaseVersion();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-200/50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      <header className="text-white shadow-header shrink-0 pt-[max(0.25rem,env(safe-area-inset-top))] bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900">
        <div className="max-w-5xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={PRODUCT_LANDING_PATH} className="flex items-center gap-3 min-w-0 shrink-0" title="製品案内へ">
              <img
                src={DEFAULT_APP_LOGO_URL}
                alt=""
                className="h-9 w-auto max-w-[130px] sm:h-10 sm:max-w-[150px] object-contain shrink-0 drop-shadow-md rounded-md bg-white/10 p-0.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight leading-snug truncate">
                <Link to={PRODUCT_LANDING_PATH} className="hover:underline underline-offset-2">
                  {APP_DISPLAY_NAME}
                </Link>
              </p>
              <p className="text-[11px] text-white/75 mt-0.5">
                <span className="opacity-90">ドキュメント</span>
                {version ? (
                  <span className="ml-2 tabular-nums rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">
                    v{version}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto text-xs sm:text-sm font-medium">
            <ThemeFullscreenControls variant="monitor" />
            <Link to={PRODUCT_LANDING_PATH} className="btn-ghost-header">
              製品案内
            </Link>
            <Link to={changelogPath} className="btn-ghost-header">
              更新履歴
            </Link>
            <Link to={manualPath} className="btn-ghost-header">
              マニュアル
            </Link>
            <Link to={SLIDES_PATH} className="btn-ghost-header">
              スライド
            </Link>
            <Link to={TERMS_PATH} className="btn-ghost-header">
              利用規約
            </Link>
            <Link to={PRIVACY_PATH} className="btn-ghost-header">
              プライバシー
            </Link>
            <Link to={monitorPath} className="btn-ghost-header">
              監視画面
            </Link>
            <Link to={adminLoginPath} className="btn-ghost-header">
              管理ログイン
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-8 sm:py-10">
        <nav className="text-xs text-slate-500 dark:text-slate-400 mb-4" aria-label="パンくず">
          <Link to={PRODUCT_LANDING_PATH} className="text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
            製品案内
          </Link>
          <span className="mx-1.5" aria-hidden>
            /
          </span>
          <span className="text-slate-700 dark:text-slate-300">{title}</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">{title}</h1>
        {description ? (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-3xl leading-relaxed">{description}</p>
        ) : (
          <div className="mb-8" />
        )}
        {children}
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {APP_DISPLAY_NAME}
            {version ? <span className="ml-2 tabular-nums">v{version}</span> : null}
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-end">
            <Link to={changelogPath} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              更新履歴
            </Link>
            <Link to={manualPath} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              管理マニュアル
            </Link>
            <Link to={SLIDES_PATH} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              スライド紹介
            </Link>
            <Link to={TERMS_PATH} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              利用規約
            </Link>
            <Link to={PRIVACY_PATH} className="font-medium text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
              プライバシー
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500 dark:text-slate-500">
          制作・開発：{PRODUCTION_COMPANY_NAME}
        </p>
      </footer>
    </div>
  );
}
