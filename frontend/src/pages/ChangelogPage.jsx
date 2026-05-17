import PublicDocsLayout from '../components/PublicDocsLayout';
import { RELEASE_NOTES } from '../lib/releaseNotes';
import { getAppReleaseVersion } from '../lib/appRelease';

export default function ChangelogPage() {
  const version = getAppReleaseVersion();

  return (
    <PublicDocsLayout
      title="更新履歴"
      description={
        <>
          主な機能追加・文言や画面の調整ごとのお知らせです。<strong className="tabular-nums">最新の版は v{version || '—'}</strong>（画面上部の製品ヘッダーに表示されます）。新しい順に並んでいます。
        </>
      }
    >
      <div className="space-y-8">
        {RELEASE_NOTES.map((entry) => (
          <article key={entry.version} className="surface-card p-5 sm:p-6 scroll-mt-4" id={`v-${entry.version}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4 pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">v{entry.version}</h2>
              <time dateTime={entry.date} className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                {entry.date}
              </time>
              {entry.title ? (
                <span className="text-sm font-medium text-sky-800 dark:text-sky-300">{entry.title}</span>
              ) : null}
            </div>
            <ul className="list-disc list-outside space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {entry.items.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </PublicDocsLayout>
  );
}
