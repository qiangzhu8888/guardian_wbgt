import { Link } from 'react-router-dom';
import MobileMonitorQrBlock from '../components/MobileMonitorQrBlock';
import { PRODUCT_LANDING_PATH } from '../lib/productLandingCta';
import { getLevelStyle } from './levelStyles';
import { LevelBadge, LiveBadge, MockBadge } from './MonitoringBadges.jsx';
import { WbgtGuidelinesPanel } from './WbgtGuidelinesPanel.jsx';

export { LevelBadge, LiveBadge, MockBadge } from './MonitoringBadges.jsx';

export function DashboardView({
  facilities,
  loading,
  error,
  lastFetched,
  anomalySensor,
  onSelectFacility,
  orgSlug,
}) {
  const topFacility = facilities.find((f) => f.level !== '通信異常' && f.level !== 'ほぼ安全');

  const counts = {
    危険: facilities.filter((f) => f.level === '危険').length,
    厳重警戒: facilities.filter((f) => f.level === '厳重警戒').length,
    警戒: facilities.filter((f) => f.level === '警戒').length,
    注意: facilities.filter((f) => f.level === '注意').length,
  };

  const summaryItems = [
    {
      label: '危険',
      count: counts['危険'],
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 border-red-100 dark:bg-red-950/35 dark:border-red-900/55',
    },
    {
      label: '厳重警戒',
      count: counts['厳重警戒'],
      color: 'bg-orange-500',
      textColor: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50',
    },
    {
      label: '警戒',
      count: counts['警戒'],
      color: 'bg-yellow-400',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 border-yellow-100 dark:bg-yellow-950/28 dark:border-yellow-900/45',
    },
    {
      label: '注意',
      count: counts['注意'],
      color: 'bg-blue-400',
      textColor: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50',
    },
  ];

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 dark:bg-red-950/40 dark:border-red-800/70">
          <span className="text-red-500 text-lg">⚠</span>
          <p className="text-sm text-red-700 dark:text-red-200">センサー通信エラー: {error}</p>
        </div>
      )}

      {topFacility && (
        <div
          className={`rounded-xl border p-4 flex items-start gap-3 ${getLevelStyle(topFacility.level).alert}`}
        >
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div className="space-y-1">
            <p className="font-semibold text-sm leading-snug">
              現在のアラート：<strong>{topFacility.name}</strong>は
              <strong>「{topFacility.level}」</strong>です。屋外活動の見直しを推奨します。
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryItems.map((item) => (
          <div key={item.label} className={`rounded-xl border p-4 shadow-soft ${item.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{item.label}</span>
            </div>
            <p className={`text-3xl font-bold ${item.textColor}`}>
              {item.count}
              <span className="text-sm font-normal text-gray-400 dark:text-slate-500 ml-1">施設</span>
            </p>
          </div>
        ))}
      </div>

      <MobileMonitorQrBlock orgSlug={orgSlug} variant="monitor" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-sky-200/90 bg-sky-50/90 px-4 py-3 dark:border-sky-800/55 dark:bg-sky-950/35">
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">
          製品情報・ソリューション概要は製品ページをご覧ください。
        </p>
        <Link
          to={PRODUCT_LANDING_PATH}
          className="inline-flex items-center justify-center sm:justify-end gap-1 text-sm font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300 underline-offset-4 hover:underline shrink-0 touch-manipulation py-1"
        >
          製品ページへ
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
        <span>施設一覧（危険度順）</span>
        <span className="flex items-center gap-2">
          {loading && <span className="animate-pulse text-blue-400 dark:text-sky-400">データ取得中...</span>}
          {lastFetched && !loading && (
            <span>
              最終取得{' '}
              {lastFetched.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((f) => {
          const style = getLevelStyle(f.level);
          return (
            <button
              key={f.id}
              type="button"
              aria-label={`${f.name}の詳細を開く`}
              onClick={() => onSelectFacility?.(f)}
              className={`text-left rounded-xl bg-white dark:bg-slate-900 shadow-card border border-slate-100/90 dark:border-slate-600/80 ${style.cardBorder} p-4 w-full transition-transform hover:shadow-md hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 touch-manipulation active:scale-[0.99]`}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    {f.isMock ? <MockBadge /> : <LiveBadge />}
                    <LevelBadge level={f.level} />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm leading-tight truncate">{f.name}</h3>
                </div>
                {f.installationPhotoUrl ? (
                  <img
                    src={f.installationPhotoUrl}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
                {f.weatherIcon} {f.weather}　{f.temp}℃　湿度 {f.humidity}%
              </p>

              <div className="mb-3">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">現在 WBGT</p>
                <p className={`text-4xl font-extrabold leading-none ${style.text}`}>
                  {f.wbgt}
                  <span className="text-base font-normal text-gray-400 dark:text-slate-500 ml-1">℃</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                <span className="text-xs text-gray-400 dark:text-slate-500">最終更新 {f.updated}</span>
                {onSelectFacility ? (
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">詳細 →</span>
                ) : null}
              </div>
            </button>
          );
        })}

        {anomalySensor?.name ? (
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-600 shadow-soft border-l-4 border-l-slate-400 p-4 opacity-75 dark:opacity-90">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">⚡ センサー異常</p>
                <h3 className="font-bold text-gray-600 dark:text-slate-300 text-sm">{anomalySensor.name}</h3>
              </div>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600">
                通信異常
              </span>
            </div>
            <p className="text-4xl font-extrabold text-gray-300 dark:text-slate-600 leading-none mb-3">--.-</p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
              <span className="text-xs text-gray-400 dark:text-slate-500">最終受信 {anomalySensor?.lastSeen}</span>
              <span className="text-xs text-gray-400 dark:text-slate-500">データなし</span>
            </div>
          </div>
        ) : null}
      </div>

      <WbgtGuidelinesPanel variant="dashboard" />
    </div>
  );
}
