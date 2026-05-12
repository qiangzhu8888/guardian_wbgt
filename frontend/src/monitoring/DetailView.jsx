import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { getWBGTLevel } from '../lib/wbgt';
import { getLevelStyle, getWbgtColor, wbgtNextLevel } from './levelStyles';
import { LevelBadge, LiveBadge, MockBadge } from './DashboardView';

export function DetailView({
  facility,
  onBack,
  hourlyForecastDemo = [],
  weatherForecastDemo = [],
  showDemoForecast = false,
}) {
  const [timeRange, setTimeRange] = useState(6);
  const style = getLevelStyle(facility.level);

  const chartData = useMemo(() => {
    if (!facility.isMock && facility.history && facility.history.length > 0) {
      const cutoff = Date.now() - timeRange * 60 * 60 * 1000;
      return facility.history
        .filter((p) => p.time >= cutoff)
        .map((p) => ({
          label: p.label,
          wbgt: p.wbgt,
          temp: p.temp,
          humidity: p.humidity,
        }));
    }
    if (showDemoForecast && hourlyForecastDemo.length > 0) {
      return hourlyForecastDemo.map((h) => ({
        label: h.time,
        wbgt: h.wbgt,
        temp: null,
        humidity: null,
      }));
    }
    return [];
  }, [facility, timeRange, showDemoForecast, hourlyForecastDemo]);

  const yMin = useMemo(() => {
    if (chartData.length === 0) return 15;
    const min = Math.min(...chartData.map((d) => d.wbgt));
    return Math.floor(min - 1);
  }, [chartData]);

  const yMax = useMemo(() => {
    if (chartData.length === 0) return 36;
    const max = Math.max(...chartData.map((d) => d.wbgt));
    return Math.ceil(max + 1);
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const wbgtPayload = payload.find((p) => p.dataKey === 'wbgt');
      const tempPayload = payload.find((p) => p.dataKey === 'temp');
      const val = wbgtPayload?.value;
      if (!val) return null;
      const lvl = getWBGTLevel(val);
      const s = getLevelStyle(lvl);
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm space-y-1">
          <p className="font-semibold text-gray-600 text-xs">{label}</p>
          <p className={`font-bold ${s.text}`}>WBGT {val}℃</p>
          {tempPayload?.value != null && (
            <p className="text-gray-500 text-xs">気温 {tempPayload.value}℃</p>
          )}
          <LevelBadge level={lvl} />
        </div>
      );
    }
    return null;
  };

  const tableRows = useMemo(() => {
    if (facility.isMock && showDemoForecast) {
      return hourlyForecastDemo.map((r) => ({
        label: r.time,
        wbgt: r.wbgt,
        temp: null,
        humidity: null,
        level: r.level,
      }));
    }
    return [...chartData].reverse();
  }, [facility.isMock, showDemoForecast, hourlyForecastDemo, chartData]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-h-[44px] text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors touch-manipulation"
        >
          ← 戻る
        </button>
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-gray-900 text-lg">{facility.name}</h2>
            <LevelBadge level={facility.level} size="lg" />
            {!facility.isMock && <LiveBadge />}
          </div>
          {facility.address ? (
            <p className="text-xs text-gray-500">{facility.address}</p>
          ) : null}
        </div>
        <p className="text-xs text-gray-400 hidden sm:block">最終更新 {facility.updated}</p>
      </div>

      <div className={`rounded-xl ${style.bg} border p-5`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'WBGT 暑さ指数', value: facility.wbgt, unit: '℃', color: style.text },
            { label: '気温', value: facility.temp, unit: '℃', color: 'text-gray-700' },
            { label: '湿度', value: facility.humidity, unit: '%', color: 'text-gray-700' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className={`text-4xl sm:text-5xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="text-sm text-gray-400">{item.unit}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            {facility.weatherIcon} 天気：{facility.weather}　
            最終更新：{facility.updated}　
            {!facility.isMock && (
              <span className="text-emerald-600 font-semibold">● リアルタイムデータ</span>
            )}
          </p>
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${style.alert}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚠️</span>
          <h3 className="font-bold text-base">行動目安</h3>
        </div>
        <ul className="space-y-2">
          {(
            facility.level === '危険' || facility.level === '厳重警戒'
              ? ['屋外活動は中止を推奨', 'こまめな水分補給（15〜20分ごとに少量ずつ）', '日陰での休憩を徹底']
              : facility.level === '警戒'
                ? ['激しい運動は控える', '積極的な水分・塩分補給', '定期的な休憩と体調確認']
                : facility.level === '注意'
                  ? ['水分補給を忘れずに', '体調不良の場合は無理をしない', '熱中症の初期症状に注意']
                  : ['通常の水分補給を継続', '体調変化に注意して活動可能']
          ).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex-shrink-0">●</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-white border border-slate-100 shadow-soft p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
            WBGT 推移グラフ
            {!facility.isMock && <LiveBadge />}
            {facility.isMock && <MockBadge />}
          </h3>
          {!facility.isMock && (
            <div className="flex gap-1">
              {[1, 3, 6].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTimeRange(h)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    timeRange === h
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {h}時間
                </button>
              ))}
            </div>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            表示できるデータがありません
          </div>
        ) : (
          <div className="h-[200px] w-full sm:h-[240px] min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 24, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              {yMax >= 31 && (
                <ReferenceLine
                  y={31}
                  stroke="#f97316"
                  strokeDasharray="4 4"
                  label={{
                    value: '厳重警戒 31℃',
                    position: 'insideTopRight',
                    fill: '#f97316',
                    fontSize: 10,
                  }}
                />
              )}
              {yMax >= 33 && (
                <ReferenceLine
                  y={33}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: '危険 33℃',
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                />
              )}
              {!facility.isMock && chartData.some((d) => d.temp != null) && (
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  name="気温"
                />
              )}
              <Line
                type="monotone"
                dataKey="wbgt"
                stroke="#f97316"
                strokeWidth={3}
                name="WBGT"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      key={`dot-${payload.label}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={getWbgtColor(payload.wbgt)}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 h-0.5 bg-orange-400 rounded" />
            WBGT（暑さ指数）
          </span>
          {!facility.isMock && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-5 border-t border-dashed border-slate-400" />
              気温
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700 text-sm">
            {facility.isMock && showDemoForecast
              ? '時間別予測（デモデータ）'
              : `時間別履歴（直近${timeRange}時間）`}
          </h3>
          {!facility.isMock && <span className="text-xs text-gray-400">{chartData.length}件</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left px-4 py-2 font-medium">時刻</th>
                <th className="text-center px-4 py-2 font-medium">WBGT</th>
                {!facility.isMock && <th className="text-center px-4 py-2 font-medium">気温</th>}
                {!facility.isMock && <th className="text-center px-4 py-2 font-medium">湿度</th>}
                <th className="text-center px-4 py-2 font-medium">危険度</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => {
                const lvl = row.level || getWBGTLevel(row.wbgt);
                const s = getLevelStyle(lvl);
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-gray-700 text-sm">{row.label}</td>
                    <td className={`px-4 py-2.5 text-center font-bold text-base ${s.text}`}>{row.wbgt}</td>
                    {!facility.isMock && (
                      <td className="px-4 py-2.5 text-center text-gray-600">{row.temp}</td>
                    )}
                    {!facility.isMock && (
                      <td className="px-4 py-2.5 text-center text-gray-600">{row.humidity}%</td>
                    )}
                    <td className="px-4 py-2.5 text-center">
                      <LevelBadge level={lvl} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!facility.isMock && (
        <div className="rounded-xl bg-white border border-slate-100 shadow-soft p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
            センサー情報 <LiveBadge />
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-gray-500 mb-1">デバイスID</p>
              <p className="text-sm font-mono text-gray-700 break-all">{facility.deviceId}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-gray-500 mb-1">データ取得時刻</p>
              <p className="text-sm font-semibold text-gray-700">{facility.updated}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
            <p className="text-xs text-emerald-800">
              💡 WBGT は <strong>
                温度 {facility.temp}℃ × 湿度 {facility.humidity}%
              </strong>{' '}
              から Stull(2011)湿球温度式で推定しています。
              <br />
              屋外・直射日光下では実際のWBGTが高くなる場合があります。
            </p>
          </div>
        </div>
      )}

      {facility.isMock && showDemoForecast && weatherForecastDemo.length > 0 && (
        <div className="rounded-xl bg-white border border-slate-100 shadow-soft p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">天気予報（デモ）</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {weatherForecastDemo.map((w, i) => (
              <div key={i} className="rounded-lg bg-sky-50 border border-sky-100 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{w.time}</p>
                <p className="text-2xl mb-1">{w.weatherIcon}</p>
                <p className="text-xs font-medium text-gray-600">{w.weather}</p>
                <p className="text-sm font-bold text-gray-700 mt-1">{w.temp}℃</p>
                <p className="text-xs text-gray-400">湿度 {w.humidity}%</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
            <p className="text-xs text-amber-800">
              💬 デモ用の参考表示です。実運用では気象データソースを接続するか、この欄を非表示にしてください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
