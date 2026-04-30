import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useBuildicsData } from './hooks/useBuildicsData';
import { calculateWBGT, getWBGTLevel } from './lib/wbgt';

// ─────────────────────────────────────────────
// センサー ↔ 施設マッピング設定
// ─────────────────────────────────────────────
const DEVICE_MAPPINGS = [
  { deviceId: '350976658106130', facilityId: 1 },
  // 追加センサーはここに追記:
  // { deviceId: 'XXXXXXXX', facilityId: 2 },
];

// ─────────────────────────────────────────────
// モックデータ（センサー未設置施設・デモ用）
// ─────────────────────────────────────────────
const LEVEL_ORDER = { '危険': 0, '厳重警戒': 1, '警戒': 2, '注意': 3, 'ほぼ安全': 4, '通信異常': 5 };

const MOCK_FACILITIES = [
  {
    id: 1,
    name: '北里小学校グランド',
    wbgt: 31.2,
    level: '厳重警戒',
    wbgtNext: 33.0,
    weather: '晴れ',
    weatherIcon: '☀️',
    temp: 32.5,
    humidity: 68,
    updated: '10:15',
    isMock: true,
  },
  {
    id: 2,
    name: '北里保育園',
    wbgt: 29.0,
    level: '警戒',
    wbgtNext: 30.4,
    weather: '晴れ時々曇り',
    weatherIcon: '⛅',
    temp: 31.0,
    humidity: 70,
    updated: '10:14',
    isMock: true,
  },
  {
    id: 3,
    name: '北里幼稚園',
    wbgt: 28.5,
    level: '警戒',
    wbgtNext: 29.8,
    weather: '曇り',
    weatherIcon: '☁️',
    temp: 30.2,
    humidity: 69,
    updated: '10:13',
    isMock: true,
  },
  {
    id: 4,
    name: '北里小学校体育館',
    wbgt: 28.0,
    level: '警戒',
    wbgtNext: 29.2,
    weather: '屋内',
    weatherIcon: '🏫',
    temp: 30.0,
    humidity: 66,
    updated: '10:12',
    isMock: true,
  },
  {
    id: 5,
    name: 'くじら保育園',
    wbgt: 27.0,
    level: '注意',
    wbgtNext: 28.1,
    weather: '曇り',
    weatherIcon: '☁️',
    temp: 29.3,
    humidity: 64,
    updated: '10:11',
    isMock: true,
  },
];

const ANOMALY_SENSOR = { name: '北門付近センサー', lastSeen: '09:42' };

const HOURLY_FORECAST = [
  { time: '10:00', wbgt: 31.2, level: '厳重警戒' },
  { time: '11:00', wbgt: 32.5, level: '危険' },
  { time: '12:00', wbgt: 33.4, level: '危険' },
  { time: '13:00', wbgt: 32.8, level: '危険' },
];

const WEATHER_FORECAST = [
  { time: '11:00', weather: '晴れ', weatherIcon: '☀️', temp: 33, humidity: 70 },
  { time: '12:00', weather: '晴れ', weatherIcon: '☀️', temp: 34, humidity: 72 },
  { time: '13:00', weather: '晴れ時々曇り', weatherIcon: '⛅', temp: 33, humidity: 71 },
];

// ─────────────────────────────────────────────
// 危険度スタイル関数
// ─────────────────────────────────────────────
function getLevelStyle(level) {
  switch (level) {
    case '危険':
      return {
        badge: 'bg-red-100 text-red-700 border border-red-300',
        text: 'text-red-600',
        cardBorder: 'border-l-4 border-l-red-500',
        bg: 'bg-red-50',
        dot: 'bg-red-500',
        alert: 'bg-red-50 border-red-200 text-red-800',
        summary: 'bg-red-50 border-red-100',
        summaryText: 'text-red-600',
        summaryDot: 'bg-red-500',
      };
    case '厳重警戒':
      return {
        badge: 'bg-orange-100 text-orange-700 border border-orange-300',
        text: 'text-orange-600',
        cardBorder: 'border-l-4 border-l-orange-500',
        bg: 'bg-orange-50',
        dot: 'bg-orange-500',
        alert: 'bg-orange-50 border-orange-200 text-orange-800',
        summary: 'bg-orange-50 border-orange-100',
        summaryText: 'text-orange-600',
        summaryDot: 'bg-orange-500',
      };
    case '警戒':
      return {
        badge: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
        text: 'text-yellow-600',
        cardBorder: 'border-l-4 border-l-yellow-400',
        bg: 'bg-yellow-50',
        dot: 'bg-yellow-400',
        alert: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        summary: 'bg-yellow-50 border-yellow-100',
        summaryText: 'text-yellow-600',
        summaryDot: 'bg-yellow-400',
      };
    case '注意':
      return {
        badge: 'bg-blue-100 text-blue-700 border border-blue-300',
        text: 'text-blue-600',
        cardBorder: 'border-l-4 border-l-blue-400',
        bg: 'bg-blue-50',
        dot: 'bg-blue-400',
        alert: 'bg-blue-50 border-blue-200 text-blue-800',
        summary: 'bg-blue-50 border-blue-100',
        summaryText: 'text-blue-600',
        summaryDot: 'bg-blue-400',
      };
    case 'ほぼ安全':
      return {
        badge: 'bg-green-100 text-green-700 border border-green-300',
        text: 'text-green-600',
        cardBorder: 'border-l-4 border-l-green-400',
        bg: 'bg-green-50',
        dot: 'bg-green-400',
        alert: 'bg-green-50 border-green-200 text-green-800',
        summary: 'bg-green-50 border-green-100',
        summaryText: 'text-green-600',
        summaryDot: 'bg-green-400',
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-600 border border-gray-300',
        text: 'text-gray-500',
        cardBorder: 'border-l-4 border-l-gray-400',
        bg: 'bg-gray-50',
        dot: 'bg-gray-400',
        alert: 'bg-gray-50 border-gray-200 text-gray-700',
        summary: 'bg-gray-50 border-gray-100',
        summaryText: 'text-gray-500',
        summaryDot: 'bg-gray-400',
      };
  }
}

function getWbgtColor(wbgt) {
  if (wbgt >= 33) return '#ef4444';
  if (wbgt >= 31) return '#f97316';
  if (wbgt >= 28) return '#eab308';
  if (wbgt >= 25) return '#3b82f6';
  if (wbgt >= 21) return '#22c55e';
  return '#6b7280';
}

function wbgtNextLevel(wbgtNext) {
  return getWBGTLevel(wbgtNext);
}

// ─────────────────────────────────────────────
// サブコンポーネント
// ─────────────────────────────────────────────

function LevelBadge({ level, size = 'sm' }) {
  const style = getLevelStyle(level);
  const sizeClass = size === 'lg'
    ? 'px-3 py-1 text-sm font-bold'
    : 'px-2.5 py-0.5 text-xs font-semibold';
  return (
    <span className={`inline-flex items-center rounded-full ${sizeClass} ${style.badge}`}>
      {level}
    </span>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      LIVE
    </span>
  );
}

function MockBadge() {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
      デモ
    </span>
  );
}

// ─────────────────────────────────────────────
// ダッシュボード画面
// ─────────────────────────────────────────────

function DashboardView({ facilities, loading, error, lastFetched, onSelectFacility }) {
  const topLevel = facilities[0]?.level;

  const counts = {
    '危険': facilities.filter(f => f.level === '危険').length,
    '厳重警戒': facilities.filter(f => f.level === '厳重警戒').length,
    '警戒': facilities.filter(f => f.level === '警戒').length,
    '注意': facilities.filter(f => f.level === '注意').length,
  };

  const summaryItems = [
    { label: '危険', count: counts['危険'], color: 'bg-red-500', textColor: 'text-red-600', bg: 'bg-red-50 border-red-100' },
    { label: '厳重警戒', count: counts['厳重警戒'], color: 'bg-orange-500', textColor: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
    { label: '警戒', count: counts['警戒'], color: 'bg-yellow-400', textColor: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
    { label: '注意', count: counts['注意'], color: 'bg-blue-400', textColor: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  ];

  const topFacility = facilities.find(f => f.level !== '通信異常' && f.level !== 'ほぼ安全');

  return (
    <div className="space-y-5">
      {/* APIエラー表示 */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
          <span className="text-red-500 text-lg">⚠</span>
          <p className="text-sm text-red-700">センサー通信エラー: {error}</p>
        </div>
      )}

      {/* アラートバー */}
      {topFacility && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${getLevelStyle(topFacility.level).alert}`}>
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div className="space-y-1">
            <p className="font-semibold text-sm leading-snug">
              現在のアラート：<strong>{topFacility.name}</strong>は
              <strong>「{topFacility.level}」</strong>です。屋外活動の見直しを推奨します。
            </p>
            {topFacility.wbgtNext >= 31 && (
              <p className="text-xs leading-snug opacity-90">
                🔮 予測：1時間後、{topFacility.name}は
                <strong>「{wbgtNextLevel(topFacility.wbgtNext)}」</strong>レベルに到達する見込みです。
              </p>
            )}
          </div>
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryItems.map(item => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
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

      {/* 更新状態バー */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>施設一覧（危険度順）</span>
        <span className="flex items-center gap-2">
          {loading && <span className="animate-pulse text-blue-400">データ取得中...</span>}
          {lastFetched && !loading && (
            <span>最終取得 {lastFetched.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          )}
        </span>
      </div>

      {/* 施設カード一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map(f => {
          const style = getLevelStyle(f.level);
          const nextLvl = wbgtNextLevel(f.wbgtNext);
          const nextStyle = getLevelStyle(nextLvl);
          return (
            <button
              key={f.id}
              onClick={() => onSelectFacility(f)}
              className={`text-left rounded-xl bg-white shadow-sm border border-gray-100 ${style.cardBorder} p-4 hover:shadow-md transition-shadow cursor-pointer w-full`}
            >
              {/* ヘッダー */}
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

              {/* WBGT */}
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

              {/* フッター */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">最終更新 {f.updated}</span>
                <span className="text-xs text-slate-500 font-medium">詳細 →</span>
              </div>
            </button>
          );
        })}

        {/* 通信異常カード */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 border-l-4 border-l-gray-400 p-4 opacity-75">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">⚡ センサー異常</p>
              <h3 className="font-bold text-gray-600 text-sm">{ANOMALY_SENSOR.name}</h3>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
              通信異常
            </span>
          </div>
          <p className="text-4xl font-extrabold text-gray-300 leading-none mb-3">--.-</p>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">最終受信 {ANOMALY_SENSOR.lastSeen}</span>
            <span className="text-xs text-gray-400">データなし</span>
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="rounded-xl bg-white border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">WBGT 危険度基準（環境省ガイドライン）</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '危険 31℃以上', badge: '危険' },
            { label: '厳重警戒 28〜31℃', badge: '厳重警戒' },
            { label: '警戒 25〜28℃', badge: '警戒' },
            { label: '注意 21〜25℃', badge: '注意' },
            { label: 'ほぼ安全 21℃未満', badge: 'ほぼ安全' },
          ].map(item => (
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

// ─────────────────────────────────────────────
// 詳細画面
// ─────────────────────────────────────────────

function DetailView({ facility, onBack }) {
  const [timeRange, setTimeRange] = useState(6); // 時間範囲: 1 / 3 / 6 時間
  const style = getLevelStyle(facility.level);

  // グラフデータ: LIVEなら履歴データ、モックならダミー予測
  const chartData = useMemo(() => {
    if (!facility.isMock && facility.history && facility.history.length > 0) {
      const cutoff = Date.now() - timeRange * 60 * 60 * 1000;
      return facility.history
        .filter(p => p.time >= cutoff)
        .map(p => ({ label: p.label, wbgt: p.wbgt, temp: p.temp, humidity: p.humidity }));
    }
    return HOURLY_FORECAST.map(h => ({ label: h.time, wbgt: h.wbgt, temp: null, humidity: null }));
  }, [facility, timeRange]);

  // グラフY軸の範囲を動的に計算
  const yMin = useMemo(() => {
    if (chartData.length === 0) return 15;
    const min = Math.min(...chartData.map(d => d.wbgt));
    return Math.floor(min - 1);
  }, [chartData]);

  const yMax = useMemo(() => {
    if (chartData.length === 0) return 36;
    const max = Math.max(...chartData.map(d => d.wbgt));
    return Math.ceil(max + 1);
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const wbgtPayload = payload.find(p => p.dataKey === 'wbgt');
      const tempPayload = payload.find(p => p.dataKey === 'temp');
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

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← 戻る
        </button>
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <h2 className="font-bold text-gray-900 text-lg">{facility.name}</h2>
          <LevelBadge level={facility.level} size="lg" />
          {!facility.isMock && <LiveBadge />}
        </div>
        <p className="text-xs text-gray-400 hidden sm:block">最終更新 {facility.updated}</p>
      </div>

      {/* 現在値カード */}
      <div className={`rounded-xl ${style.bg} border p-5`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'WBGT 暑さ指数', value: facility.wbgt, unit: '℃', color: style.text },
            { label: '気温', value: facility.temp, unit: '℃', color: 'text-gray-700' },
            { label: '湿度', value: facility.humidity, unit: '%', color: 'text-gray-700' },
          ].map(item => (
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

      {/* 行動目安 */}
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

      {/* WBGT 推移グラフ */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
            WBGT 推移グラフ
            {!facility.isMock && <LiveBadge />}
            {facility.isMock && <MockBadge />}
          </h3>
          {/* 時間範囲セレクター（LIVEのみ） */}
          {!facility.isMock && (
            <div className="flex gap-1">
              {[1, 3, 6].map(h => (
                <button
                  key={h}
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
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 24, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              {/* 危険度基準ライン（グラフ範囲内のみ表示） */}
              {yMax >= 31 && (
                <ReferenceLine y={31} stroke="#f97316" strokeDasharray="4 4"
                  label={{ value: '厳重警戒 31℃', position: 'insideTopRight', fill: '#f97316', fontSize: 10 }} />
              )}
              {yMax >= 33 && (
                <ReferenceLine y={33} stroke="#ef4444" strokeDasharray="4 4"
                  label={{ value: '危険 33℃', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
              )}
              {/* 気温ライン（LIVEデータがある場合のみ） */}
              {!facility.isMock && chartData.some(d => d.temp != null) && (
                <Line
                  type="monotone" dataKey="temp" stroke="#94a3b8" strokeWidth={1.5}
                  strokeDasharray="4 2" dot={false} name="気温"
                />
              )}
              {/* WBGTライン */}
              <Line
                type="monotone" dataKey="wbgt" stroke="#f97316" strokeWidth={3} name="WBGT"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      key={`dot-${payload.label}`}
                      cx={cx} cy={cy} r={4}
                      fill={getWbgtColor(payload.wbgt)}
                      stroke="white" strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* 凡例 */}
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

      {/* 時間別テーブル（モック: 予測表、LIVE: 履歴テーブル） */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700 text-sm">
            {facility.isMock ? '時間別予測（デモデータ）' : `時間別履歴（直近${timeRange}時間）`}
          </h3>
          {!facility.isMock && (
            <span className="text-xs text-gray-400">{chartData.length}件</span>
          )}
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
              {(facility.isMock
                ? HOURLY_FORECAST.map(r => ({
                    label: r.time, wbgt: r.wbgt, temp: null, humidity: null, level: r.level,
                  }))
                : [...chartData].reverse()
              ).map((row, i) => {
                const lvl = row.level || getWBGTLevel(row.wbgt);
                const s = getLevelStyle(lvl);
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-gray-700 text-sm">{row.label}</td>
                    <td className={`px-4 py-2.5 text-center font-bold text-base ${s.text}`}>{row.wbgt}</td>
                    {!facility.isMock && <td className="px-4 py-2.5 text-center text-gray-600">{row.temp}</td>}
                    {!facility.isMock && <td className="px-4 py-2.5 text-center text-gray-600">{row.humidity}%</td>}
                    <td className="px-4 py-2.5 text-center"><LevelBadge level={lvl} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* リアルデータの場合：生センサー情報 */}
      {!facility.isMock && (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
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
              💡 WBGT は <strong>温度 {facility.temp}℃ × 湿度 {facility.humidity}%</strong> から
              Stull(2011)湿球温度式で推定しています。<br />
              屋外・直射日光下では実際のWBGTが高くなる場合があります。
            </p>
          </div>
        </div>
      )}

      {/* 天気予報（モックのみ） */}
      {facility.isMock && (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">天気予報</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {WEATHER_FORECAST.map((w, i) => (
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
              💬 正午前後にWBGTがさらに上昇する見込みです。体育・外遊びは
              <strong>午前中早めの時間帯</strong>に判断してください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// スマホプレビュー画面
// ─────────────────────────────────────────────

function MobilePreviewView({ facilities }) {
  const top = facilities[0];

  return (
    <div className="flex flex-col items-center py-6">
      <p className="text-sm text-gray-500 mb-6">スマートフォン表示イメージ（320 × 640相当）</p>
      <div className="relative w-80 bg-white rounded-[2.5rem] shadow-2xl border-4 border-gray-800 overflow-hidden"
        style={{ height: 640 }}>

        {/* ステータスバー */}
        <div className="bg-gray-900 text-white text-xs flex items-center justify-between px-5 py-1.5">
          <span>{new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-xs">北里地区 WBGT</span>
          <span>📶 🔋</span>
        </div>

        {/* ヘッダー */}
        <div className="bg-slate-800 text-white px-4 py-3">
          <h1 className="text-sm font-bold">北里地区 熱中症監視</h1>
          <p className="text-xs text-slate-400 mt-0.5">リアルタイム更新 · LIVE</p>
        </div>

        {/* スクロール領域 */}
        <div className="overflow-y-auto" style={{ height: 500 }}>
          {/* アラート */}
          {top && top.level !== 'ほぼ安全' && (
            <div className={`mx-3 mt-3 rounded-xl border p-3 ${getLevelStyle(top.level).alert}`}>
              <p className="text-xs font-semibold leading-snug">
                ⚠️ {top.name}は{top.level}<br />
                <span className="font-normal">1時間後: {wbgtNextLevel(top.wbgtNext)}予測</span>
              </p>
            </div>
          )}

          {/* 施設カード */}
          <div className="px-3 mt-3 space-y-2">
            {facilities.map(f => {
              const style = getLevelStyle(f.level);
              const nextLvl = wbgtNextLevel(f.wbgtNext);
              const nextStyle = getLevelStyle(nextLvl);
              return (
                <div key={f.id}
                  className={`rounded-xl bg-white shadow-sm border border-gray-100 ${style.cardBorder} p-3`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1 flex-1 min-w-0 mr-1">
                      {!f.isMock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />}
                      <span className="text-xs font-bold text-gray-800 truncate">{f.name}</span>
                    </div>
                    <LevelBadge level={f.level} />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400">現在 WBGT</p>
                      <p className={`text-3xl font-extrabold leading-none ${style.text}`}>
                        {f.wbgt}
                        <span className="text-xs font-normal text-gray-400 ml-0.5">℃</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">1時間後</p>
                      <p className={`text-lg font-bold ${nextStyle.text}`}>{f.wbgtNext}℃</p>
                      <LevelBadge level={nextLvl} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">更新 {f.updated}</p>
                </div>
              );
            })}

            {/* 通信異常 */}
            <div className="rounded-xl bg-white border border-gray-100 border-l-4 border-l-gray-400 p-3 opacity-70">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-600">{ANOMALY_SENSOR.name}</span>
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-300">通信異常</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-300 leading-none">--.-</p>
              <p className="text-xs text-gray-400 mt-1.5">最終受信 {ANOMALY_SENSOR.lastSeen}</p>
            </div>
          </div>
          <div className="h-14" />
        </div>

        {/* 固定アラートバー */}
        {top && (
          <div className={`absolute bottom-0 left-0 right-0 text-white text-xs font-bold px-4 py-2.5 flex items-center gap-2 ${
            top.level === '危険' ? 'bg-red-500' :
            top.level === '厳重警戒' ? 'bg-orange-500' :
            top.level === '警戒' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}>
            <span className="animate-pulse">🔴</span>
            <span>{top.name}は{top.level}　→ 詳細確認</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-4">実際のスマートフォンブラウザでもこのレイアウトで表示されます</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────

export default function HeatstrokeMonitoringDemo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState(MOCK_FACILITIES[0]);

  const { sensorData, loading, error, lastFetched, refresh } = useBuildicsData(
    DEVICE_MAPPINGS,
    60000,
  );

  // モックデータにリアルデータをマージ
  const facilities = useMemo(() => {
    const merged = MOCK_FACILITIES.map(f => {
      const live = sensorData[f.id];
      if (!live || live.status === 'no_data' || live.status === 'parse_error') return f;
      if (live.status === 'stale') {
        return { ...f, level: '通信異常', isMock: false, isLive: true };
      }
      return {
        ...f,
        wbgt: live.wbgt,
        level: live.level,
        temp: live.temp,
        humidity: live.humidity,
        updated: live.updatedStr,
        isMock: false,
        isLive: true,
        deviceId: DEVICE_MAPPINGS.find(d => d.facilityId === f.id)?.deviceId,
        wbgtNext: f.wbgtNext,
        history: live.history || [],
      };
    });
    return merged.sort((a, b) => {
      // LIVEを先頭に、次に危険度順
      if (!a.isMock && b.isMock) return -1;
      if (a.isMock && !b.isMock) return 1;
      return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    });
  }, [sensorData]);

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: '📊' },
    { id: 'detail', label: `詳細：${selectedFacility.name.replace('北里', '')}`, icon: '🔍' },
    { id: 'mobile', label: 'スマホ', icon: '📱' },
  ];

  const handleSelectFacility = (f) => {
    setSelectedFacility(f);
    setActiveTab('detail');
  };

  // ポーリング更新のたびに詳細画面の施設データも最新に保つ
  const currentFacility = useMemo(
    () => facilities.find(f => f.id === selectedFacility.id) || selectedFacility,
    [facilities, selectedFacility],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* グローバルヘッダー */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-bold tracking-tight">北里地区 熱中症監視システム</span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold bg-red-500 text-white animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Kitasato Area WBGT Monitoring — Powered by BUILDICS</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="text-xs text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              ↺ 更新
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">最終取得</p>
              <p className="text-sm font-semibold text-white">
                {lastFetched
                  ? lastFetched.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : loading ? '取得中...' : '--:--:--'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* タブ */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-slate-700 text-slate-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            facilities={facilities}
            loading={loading}
            error={error}
            lastFetched={lastFetched}
            onSelectFacility={handleSelectFacility}
          />
        )}
        {activeTab === 'detail' && (
          <DetailView facility={currentFacility} onBack={() => setActiveTab('dashboard')} />
        )}
        {activeTab === 'mobile' && (
          <MobilePreviewView facilities={facilities} />
        )}
      </main>

      {/* フッター */}
      <footer className="mt-10 border-t border-gray-200 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-400">
          <p>北里地区 熱中症監視システム　|　WBGT基準：環境省・文部科学省ガイドライン準拠</p>
          <p className="mt-1">センサーデータ提供：BUILDICS®　|　WBGT推定式：Stull (2011) 湿球温度モデル</p>
        </div>
      </footer>
    </div>
  );
}
