import { usePwaInstall } from '../hooks/usePwaInstall';
import { PWA_INSTALL_DISMISS_DAYS } from '../lib/pwaInstallHelpers';

/** 公開画面下部の PWA インストール（またはホーム追加）案内 */
export default function PwaInstallBanner() {
  const { visible, canNativeInstall, showIosSteps, busy, install, dismiss } = usePwaInstall();

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none print:hidden"
      role="region"
      aria-label="ホーム画面への追加・アプリとしてのインストール"
    >
      <div className="pointer-events-auto max-w-xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-600/90 bg-white/96 dark:bg-slate-900/96 backdrop-blur-md shadow-xl shadow-slate-900/10 dark:shadow-black/40 px-4 py-3.5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden>
            📲
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              ホーム画面に追加すると、監視画面をすぐ開けます
            </p>
            {showIosSteps ? (
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4 leading-relaxed">
                <li>Safari でこのページを開いていることを確認してください</li>
                <li>
                  画面下部の <strong className="text-slate-800 dark:text-slate-200">共有</strong> をタップ
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">ホーム画面に追加</strong> を選んで完了
                </li>
              </ol>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ブラウザのメニューから「インストール」または「アプリとしてインストール」を選ぶか、下のボタンでインストールダイアログを開けます。
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end border-t border-slate-200/80 dark:border-slate-700/80 pt-3">
          <button
            type="button"
            onClick={() => dismiss()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            閉じる（{PWA_INSTALL_DISMISS_DAYS}日間は表示しない）
          </button>
          {canNativeInstall ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void install()}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 shadow-sm transition-colors"
            >
              {busy ? '処理中…' : 'インストール'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
