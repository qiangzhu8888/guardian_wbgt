import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBuildicsData } from './hooks/useBuildicsData';
import { mergeFacilities } from './lib/mergeFacilities';
import { DashboardView } from './monitoring/DashboardView';
import { DetailView } from './monitoring/DetailView';
import { MobilePreviewView } from './monitoring/MobilePreviewView';

/** @param {{ config: object, appVersion?: string, orgSlug?: string }} props */
export default function HeatstrokeMonitoringDemo({ config, appVersion = '', orgSlug }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const mockFacilities = config?.mockFacilities || [];
  const [selectedFacility, setSelectedFacility] = useState(mockFacilities[0] || null);

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

  const showDemoForecast = Boolean(config?.showDemoForecast);
  const anomalySensor = config?.anomalySensor || { name: '', lastSeen: '' };
  const title = config?.title || '熱中症監視';
  const subtitle = config?.subtitle || '';
  const themePrimary = typeof config?.themePrimary === 'string' ? config.themePrimary.trim() : '';
  const logoUrl = typeof config?.logoUrl === 'string' ? config.logoUrl.trim() : '';

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
    {
      id: 'detail',
      label: `詳細：${(selectedFacility?.name || '').replace('北里', '')}`,
      icon: '🔍',
    },
    { id: 'mobile', label: 'スマホ', icon: '📱' },
  ];

  const handleSelectFacility = (f) => {
    setSelectedFacility(f);
    setActiveTab('detail');
  };

  const currentFacility = useMemo(
    () => facilities.find((f) => f.id === selectedFacility?.id) || selectedFacility,
    [facilities, selectedFacility],
  );

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
      className="min-h-screen bg-gradient-to-b from-slate-200/50 via-slate-50 to-white"
      style={themePrimary ? { ['--org-accent']: themePrimary } : undefined}
    >
      <header
        className={`text-white shadow-header ${themePrimary ? '' : 'bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900'}`}
        style={themePrimary ? { backgroundColor: themePrimary } : undefined}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-3 border-b border-white/10">
          <div className="flex items-start gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-10 w-auto max-w-[150px] object-contain shrink-0 mt-0.5 drop-shadow-md rounded-md bg-white/10 p-0.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold tracking-tight drop-shadow-sm">{title}</span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-red-500 text-white shadow-sm ring-2 ring-red-400/40 animate-pulse">
                  Live
                </span>
              </div>
              {subtitle && (
                <p className="text-xs text-white/80 mt-1 hidden sm:block leading-relaxed max-w-2xl">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link to="/admin" className="btn-ghost-header">
              管理
            </Link>
            <button type="button" onClick={refresh} className="btn-ghost-header">
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
        </div>
      </header>

      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3.5 text-sm font-medium border-b-[3px] transition-all whitespace-nowrap rounded-t-lg mt-1 ${
                  activeTab === tab.id
                    ? themePrimary
                      ? 'text-slate-900 border-[color:var(--org-accent)] bg-slate-50/90'
                      : 'text-slate-900 border-sky-600 bg-slate-50/90'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/60'
                }`}
              >
                <span className="text-base opacity-90">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            facilities={facilities}
            loading={loading}
            error={error}
            lastFetched={lastFetched}
            onSelectFacility={handleSelectFacility}
            anomalySensor={anomalySensor}
          />
        )}
        {activeTab === 'detail' && currentFacility && (
          <DetailView
            facility={currentFacility}
            onBack={() => setActiveTab('dashboard')}
            hourlyForecastDemo={config.hourlyForecastDemo || []}
            weatherForecastDemo={config.weatherForecastDemo || []}
            showDemoForecast={showDemoForecast}
          />
        )}
        {activeTab === 'mobile' && (
          <MobilePreviewView facilities={facilities} anomalySensor={anomalySensor} />
        )}
      </main>

      <footer className="mt-12 border-t border-slate-800/80 bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs leading-relaxed">
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
