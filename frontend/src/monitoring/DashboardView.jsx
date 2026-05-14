import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import MobileMonitorQrBlock from '../components/MobileMonitorQrBlock';
import {
  buildJwaChartRowsWithPastFutureSplit,
  buildJwaDashboardPreviewSeries,
  pickJwaChartXTicks,
  wbgtChartYDomain,
  wbgtYReferenceBandAreas,
} from '../lib/jwaDashboardPreviewSeries';
import { postJwaHourlyForecastBatch } from '../lib/jwaWbgtApi';
import { PRODUCT_LANDING_PATH } from '../lib/productLandingCta';
import { useDarkClass } from '../hooks/useDarkClass';
import { getLevelStyle } from './levelStyles';
import { LevelBadge, LiveBadge, MockBadge } from './MonitoringBadges.jsx';
import { WbgtGuidelinesPanel } from './WbgtGuidelinesPanel.jsx';

/** @param {string} idStr */
function parseBatchFacilityId(idStr) {
  const idNum = Number(idStr);
  return Number.isFinite(idNum) && String(Math.trunc(idNum)) === idStr ? idNum : idStr;
}

export { LevelBadge, LiveBadge, MockBadge } from './MonitoringBadges.jsx';

/** @param {{ preview?: Array<{ time?: string|null, wbgtCelsius?: number|null }> }} props */
function JwaHourlyPreviewChart({ preview }) {
  const isDark = useDarkClass();
  const data = useMemo(() => buildJwaDashboardPreviewSeries(preview), [preview]);
  const [yMin, yMax] = useMemo(() => wbgtChartYDomain(data), [data]);
  const nowMs = Date.now();
  const { rows, allPast, allFuture, nowInRange } = useMemo(
    () => buildJwaChartRowsWithPastFutureSplit(data, nowMs),
    [data, nowMs],
  );
  const bands = useMemo(
    () => wbgtYReferenceBandAreas(yMin, yMax, isDark ? 'dark' : 'light'),
    [yMin, yMax, isDark],
  );
  const ticks = useMemo(() => pickJwaChartXTicks(data.map((d) => d.ts), 8), [data]);
  const axisTickFill = isDark ? '#94a3b8' : '#64748b';
  const gridStroke = isDark ? '#47556980' : '#cbd5e1';

  if (data.length === 0) return null;

  const caption =
    allFuture
      ? '破線のみ＝すべて将来の予測枠。縦線＝現在（予測期間に含まれるとき）。緑〜赤の帯は暑さ指数の目安区分です。'
      : allPast
        ? '予測タイムステップがいずれも現在より前です。帯は目安区分。'
        : '実線＝現在まで／破線＝この先の予測。縦線＝現在。帯は目安区分。';

  return (
    <div className="mt-2 space-y-1 pointer-events-none" aria-hidden>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-slate-600 dark:text-slate-400 leading-tight">
        <span className="tabular-nums">緑〜赤：ほぼ安全〜危険</span>
      </div>
      <div className="h-[152px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 6, right: 8, bottom: 2, left: 2 }}>
            {bands.map((b) => (
              <ReferenceArea key={b.key} y1={b.y1} y2={b.y2} fill={b.fill} strokeOpacity={0} />
            ))}
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              type="number"
              dataKey="ts"
              domain={['dataMin', 'dataMax']}
              ticks={ticks}
              tickFormatter={(ts) =>
                new Date(Number(ts)).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
              }
              tick={{ fontSize: 9, fill: axisTickFill }}
              stroke={gridStroke}
            />
            <YAxis domain={[yMin, yMax]} tick={{ fontSize: 9, fill: axisTickFill }} stroke={gridStroke} width={30} />
            {nowInRange ? (
              <ReferenceLine
                x={nowMs}
                stroke={isDark ? '#94a3b8' : '#64748b'}
                strokeWidth={1}
                strokeDasharray="3 5"
                isFront
                label={{
                  value: '現在',
                  position: 'insideTopLeft',
                  fill: axisTickFill,
                  fontSize: 9,
                }}
              />
            ) : null}
            {!allFuture ? (
              <Line
                type="monotone"
                dataKey="wbgtSolid"
                stroke={isDark ? '#e2e8f0' : '#334155'}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ) : null}
            {!allPast ? (
              <Line
                type="monotone"
                dataKey="wbgtForecast"
                stroke="#0284c7"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-slate-500 dark:text-slate-500 leading-snug">{caption}</p>
    </div>
  );
}

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

  const jwaBatchKey = facilities
    .filter((f) => Number.isFinite(Number(f.lat)) && Number.isFinite(Number(f.lng)))
    .map((f) => `${String(f.id)}:${Number(f.lat)}:${Number(f.lng)}`)
    .sort()
    .join('|');

  const [jwaMeshById, setJwaMeshById] = useState({});
  const [jwaMeshStatus, setJwaMeshStatus] = useState('idle');

  useEffect(() => {
    if (!jwaBatchKey) {
      setJwaMeshById({});
      setJwaMeshStatus('idle');
      return;
    }
    const jwaRows = jwaBatchKey.split('|').map((seg) => {
      const [idStr, latStr, lngStr] = seg.split(':');
      return { id: parseBatchFacilityId(idStr), lat: Number(latStr), lng: Number(lngStr) };
    });

    let cancelled = false;
    setJwaMeshStatus('loading');

    (async () => {
      const jwaR = await postJwaHourlyForecastBatch(jwaRows);
      if (cancelled) return;

      if (!jwaR.ok) {
        setJwaMeshById({});
        if (jwaR.status === 503) {
          setJwaMeshStatus('unconfigured');
        } else {
          setJwaMeshStatus('error');
        }
        return;
      }
      const map = {};
      for (const row of jwaR.json.results || []) {
        if (row && row.id != null) map[String(row.id)] = row;
      }
      setJwaMeshById(map);
      setJwaMeshStatus('ok');
    })();
    return () => {
      cancelled = true;
    };
  }, [jwaBatchKey]);

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
                    className="size-[3.6rem] rounded-lg object-cover border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex-shrink-0"
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
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">
                  {f.isMock ? '現在の WBGT（デモ）' : '現在の WBGT（現場センサーに基づく推定値）'}
                </p>
                <p className={`text-4xl font-extrabold leading-none ${style.text}`}>
                  {f.wbgt}
                  <span className="text-base font-normal text-gray-400 dark:text-slate-500 ml-1">℃</span>
                </p>
              </div>

              {Number.isFinite(Number(f.lat)) && Number.isFinite(Number(f.lng)) && jwaMeshStatus !== 'unconfigured' ? (
                <div className="mb-3 rounded-lg border border-sky-100/90 dark:border-sky-900/45 bg-sky-50/55 dark:bg-sky-950/22 px-2.5 py-2">
                  <p className="text-[10px] font-semibold text-sky-900/90 dark:text-sky-200/95">
                    地点付近・WBGT 予測（日本気象協会・1km・参考）
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5 leading-snug">
                    登録した緯度・経度を基準としたメッシュ予測です。センサー実測値とは異なる場合があります。
                  </p>
                  {jwaMeshStatus === 'loading' ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">取得中…</p>
                  ) : jwaMeshStatus === 'error' ? (
                    <p className="text-[11px] text-sky-900/80 dark:text-sky-300/90 mt-1">取得に失敗しました</p>
                  ) : (
                    (() => {
                      const row = jwaMeshById[String(f.id)];
                      if (!row || row.ok === false) {
                        return (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {row && typeof row.msg === 'string' ? row.msg : '—'}
                          </p>
                        );
                      }
                      const prev = Array.isArray(row.preview) ? row.preview : [];
                      if (prev.length === 0) {
                        return <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">予測がありません</p>;
                      }
                      const seriesPts = buildJwaDashboardPreviewSeries(prev);
                      return (
                        <div className="mt-1">
                          {row.meshCode ? (
                            <p className="text-[10px] text-slate-500 dark:text-slate-500 tabular-nums">
                              メッシュ {row.meshCode}
                            </p>
                          ) : null}
                          {seriesPts.length === 0 ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              グラフ表示に使える時系列がありません
                            </p>
                          ) : (
                            <>
                              <JwaHourlyPreviewChart preview={prev} />
                            </>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : null}

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
