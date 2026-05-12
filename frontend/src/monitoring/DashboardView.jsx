import { getLevelStyle, wbgtNextLevel } from './levelStyles';

export function LevelBadge({ level, size = 'sm' }) {
  const style = getLevelStyle(level);
  const sizeClass =
    size === 'lg' ? 'px-3 py-1 text-sm font-bold' : 'px-2.5 py-0.5 text-xs font-semibold';
  return (
    <span className={`inline-flex items-center rounded-full ${sizeClass} ${style.badge}`}>{level}</span>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      LIVE
    </span>
  );
}

export function MockBadge() {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
      デモ
    </span>
  );
}

export function DashboardView({
  facilities,
  loading,
  error,
  lastFetched,
  anomalySensor,
  onSelectFacility,
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
      textColor: 'text-red-600',
      bg: 'bg-red-50 border-red-100',
    },
    {
      label: '厳重警戒',
      count: counts['厳重警戒'],
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bg: 'bg-orange-50 border-orange-100',
    },
    {
      label: '警戒',
      count: counts['警戒'],
      color: 'bg-yellow-400',
      textColor: 'text-yellow-600',
      bg: 'bg-yellow-50 border-yellow-100',
    },
    {
      label: '注意',
      count: counts['注意'],
      color: 'bg-blue-400',
      textColor: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
    },
  ];

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
          <span className="text-red-500 text-lg">⚠</span>
          <p className="text-sm text-red-700">センサー通信エラー: {error}</p>
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
            {topFacility.wbgtNext >= 31 && (
              <p className="text-xs leading-snug opacity-90">
                🔮 予測：1時間後、{topFacility.name}は
                <strong>「{wbgtNextLevel(topFacility.wbgtNext)}」</strong>
                レベルに到達する見込みです。
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryItems.map((item) => (
          <div key={item.label} className={`rounded-xl border p-4 shadow-soft ${item.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs font-medium text-gray-500">{item.label}</span>
            </div>
            <p className={`text-3xl font-bold ${item.textColor}`}>
              {item.count}
              <span className="text-sm font-normal text-gray-400 ml-1">施設</span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>施設一覧（危険度順）</span>
        <span className="flex items-center gap-2">
          {loading && <span className="animate-pulse text-blue-400">データ取得中...</span>}
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
          const nextLvl = wbgtNextLevel(f.wbgtNext);
          const nextStyle = getLevelStyle(nextLvl);
          return (
            <button
              key={f.id}
              type="button"
              aria-label={`${f.name}の詳細を開く`}
              onClick={() => onSelectFacility?.(f)}
              className={`text-left rounded-xl bg-white shadow-card border border-slate-100/90 ${style.cardBorder} p-4 w-full transition-transform hover:shadow-md hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 touch-manipulation active:scale-[0.99]`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    {f.isMock ? <MockBadge /> : <LiveBadge />}
                    <LevelBadge level={f.level} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">{f.name}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {f.weatherIcon} {f.weather}　{f.temp}℃　湿度 {f.humidity}%
              </p>

              <div className="flex items-end gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">現在 WBGT</p>
                  <p className={`text-4xl font-extrabold leading-none ${style.text}`}>
                    {f.wbgt}
                    <span className="text-base font-normal text-gray-400 ml-1">℃</span>
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-400 mb-0.5">1時間後予測</p>
                  <p className={`text-xl font-bold ${nextStyle.text}`}>
                    {f.wbgtNext}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">℃</span>
                  </p>
                  <LevelBadge level={nextLvl} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">最終更新 {f.updated}</span>
                {onSelectFacility ? (
                  <span className="text-xs font-semibold text-sky-600">詳細 →</span>
                ) : null}
              </div>
            </button>
          );
        })}

        {anomalySensor?.name ? (
          <div className="rounded-xl bg-white border border-slate-100 shadow-soft border-l-4 border-l-slate-400 p-4 opacity-75">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">⚡ センサー異常</p>
                <h3 className="font-bold text-gray-600 text-sm">{anomalySensor.name}</h3>
              </div>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                通信異常
              </span>
            </div>
            <p className="text-4xl font-extrabold text-gray-300 leading-none mb-3">--.-</p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">最終受信 {anomalySensor?.lastSeen}</span>
              <span className="text-xs text-gray-400">データなし</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl bg-white border border-slate-100 shadow-soft p-4 sm:p-5">
        <p className="text-xs font-semibold text-gray-500 mb-2">WBGT 危険度基準（環境省ガイドライン）</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '危険 31℃以上', badge: '危険' },
            { label: '厳重警戒 28〜31℃', badge: '厳重警戒' },
            { label: '警戒 25〜28℃', badge: '警戒' },
            { label: '注意 21〜25℃', badge: '注意' },
            { label: 'ほぼ安全 21℃未満', badge: 'ほぼ安全' },
          ].map((item) => (
            <div key={item.badge} className="flex items-center gap-1.5">
              <LevelBadge level={item.badge} />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          <LiveBadge /> = BUILDICSセンサーからのリアルタイムデータ（WBGT = 0.7 × 湿球温度 + 0.3 × 気温 で推定）　
          <MockBadge /> = デモ用サンプルデータ
        </p>
      </div>
    </div>
  );
}
