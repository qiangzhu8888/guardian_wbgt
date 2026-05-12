import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBuildicsData } from './hooks/useBuildicsData';
import { mergeFacilities } from './lib/mergeFacilities';
import { DashboardView } from './monitoring/DashboardView';
import { DetailView } from './monitoring/DetailView';

/** @param {{ config: object, appVersion?: string, orgSlug?: string }} props */
export default function HeatstrokeMonitoringDemo({ config, appVersion = '', orgSlug }) {
  const mockFacilities = config?.mockFacilities || [];

  const deviceMappings = config?.deviceMappings || [];
  const polling = config?.polling || {};
  const intervalMs = polling.intervalMs ?? 60000;

  const { sensorData, loading, error, lastFetched, refresh } = useBuildicsData(
    deviceMappings,
    intervalMs,
    polling,
    orgSlug,
  );

  const facilities = useMemo(
    () => mergeFacilities(sensorData, mockFacilities, deviceMappings),
    [sensorData, mockFacilities, deviceMappings],
  );

  const [view, setView] = useState('dashboard');
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);
  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === selectedFacilityId) ?? null,
    [facilities, selectedFacilityId],
  );

  useEffect(() => {
    if (view === 'detail' && !selectedFacility) {
      setView('dashboard');
      setSelectedFacilityId(null);
    }
  }, [view, selectedFacility]);

  const showDemoForecast = Boolean(config?.showDemoForecast);
  const hourlyForecastDemo = config?.hourlyForecastDemo ?? [];
  const weatherForecastDemo = config?.weatherForecastDemo ?? [];
  const anomalySensor = config?.anomalySensor || { name: '', lastSeen: '' };
  const title = config?.title || '熱中症監視';
  const subtitle = config?.subtitle || '';
  const themePrimary = typeof config?.themePrimary === 'string' ? config.themePrimary.trim() : '';
  const logoUrl = typeof config?.logoUrl === 'string' ? config.logoUrl.trim() : '';

  if (!config || !mockFacilities.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-100 via-white to-slate-50 px-4">
        <div
          className="h-11 w-11 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"
          aria-hidden
        />
        <p className="text-sm font-medium text-slate-600">設定を読み込み中…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-200/50 via-slate-50 to-white flex flex-col"
      style={themePrimary ? { ['--org-accent']: themePrimary } : undefined}
    >
      <header
        className={`text-white shadow-header shrink-0 pt-[max(0.25rem,env(safe-area-inset-top))] ${themePrimary ? '' : 'bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900'}`}
        style={themePrimary ? { backgroundColor: themePrimary } : undefined}
      >
        <div className="max-w-6xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-3 sm:py-4 flex items-center justify-between flex-wrap gap-3 border-b border-white/10">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-9 w-auto max-w-[130px] sm:h-10 sm:max-w-[150px] object-contain shrink-0 mt-0.5 drop-shadow-md rounded-md bg-white/10 p-0.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight drop-shadow-sm leading-snug">
                  {title}
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-red-500 text-white shadow-sm ring-2 ring-red-400/40 animate-pulse shrink-0">
                  Live
                </span>
              </div>
              {subtitle && (
                <p className="text-[11px] sm:text-xs text-white/80 mt-1 leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-none">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto sm:flex-initial">
            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
              <Link to="/admin" className="btn-ghost-header shrink-0">
                管理
              </Link>
              <button type="button" onClick={refresh} className="btn-ghost-header shrink-0">
                ↺ 更新
              </button>
              <div className="text-right hidden sm:block pl-1 border-l border-white/20 ml-1">
                <p className="text-[10px] uppercase tracking-wider text-white/50">最終取得</p>
                <p className="text-sm font-semibold text-white tabular-nums">
                  {lastFetched
                    ? lastFetched.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : loading
                      ? '取得中...'
                      : '--:--:--'}
                </p>
              </div>
            </div>
            <div className="text-right sm:hidden border-t border-white/15 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-white/50">最終取得</p>
              <p className="text-xs font-semibold text-white tabular-nums">
                {lastFetched
                  ? lastFetched.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : loading
                    ? '取得中...'
                    : '--:--:--'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-4 sm:py-6 flex-1">
        {view === 'dashboard' ? (
          <DashboardView
            facilities={facilities}
            loading={loading}
            error={error}
            lastFetched={lastFetched}
            anomalySensor={anomalySensor}
            onSelectFacility={(f) => {
              setSelectedFacilityId(f.id);
              setView('detail');
            }}
          />
        ) : selectedFacility ? (
          <DetailView
            facility={selectedFacility}
            onBack={() => {
              setView('dashboard');
              setSelectedFacilityId(null);
            }}
            hourlyForecastDemo={hourlyForecastDemo}
            weatherForecastDemo={weatherForecastDemo}
            showDemoForecast={showDemoForecast}
          />
        ) : null}
      </main>

      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900 text-slate-400 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-6 text-center text-xs leading-relaxed">
          <p className="text-slate-300 font-medium">WBGT 監視（熱中症対策）</p>
          <p className="mt-2 text-slate-500 max-w-2xl mx-auto">
            WBGT 基準：環境省・文部科学省ガイドライン準拠
          </p>
          <p className="mt-1.5 text-slate-500">
            センサーデータ：BUILDICS® ／ WBGT 推定：Stull (2011) 湿球温度モデル
          </p>
          {appVersion ? (
            <p className="mt-4 text-[10px] text-slate-600 tabular-nums tracking-wide">v{appVersion}</p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
