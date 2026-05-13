import { useParams } from 'react-router-dom';
import HeatstrokeMonitoringDemo from '../HeatstrokeMonitoringDemo';
import { usePublicConfig } from '../hooks/usePublicConfig';

export default function HomePage() {
  const { orgSlug } = useParams();
  const { config, loading, error, reload } = usePublicConfig(orgSlug);
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '';

  if (loading && !config) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center gap-5 app-admin-bg px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          className="h-12 w-12 rounded-full border-[3px] border-sky-500 border-t-transparent animate-spin"
          aria-hidden
        />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">設定を読み込み中</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">しばらくお待ちください</p>
        </div>
        <button
          type="button"
          onClick={() => reload()}
          className="text-sm font-medium text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 underline underline-offset-4"
        >
          再試行
        </button>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center gap-6 app-admin-bg px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="surface-card max-w-md w-full p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
            ⚠
          </div>
          <p className="text-sm font-medium text-red-800 dark:text-red-200 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => reload()}
            className="btn-primary-solid w-full max-w-xs mx-auto"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <HeatstrokeMonitoringDemo config={config} appVersion={version} orgSlug={orgSlug} />
  );
}
