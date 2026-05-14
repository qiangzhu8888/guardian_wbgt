import { getWBGTLevel } from './wbgt';

/** @typedef {'light' | 'dark'} FillVariant */

const WBGT_BAND_EDGES = [21, 25, 28, 31];

const BAND_FILLS_LIGHT = [
  'rgba(34,197,94,0.14)',
  'rgba(59,130,246,0.14)',
  'rgba(234,179,8,0.16)',
  'rgba(249,115,22,0.16)',
  'rgba(239,68,68,0.18)',
];

const BAND_FILLS_DARK = [
  'rgba(34,197,94,0.22)',
  'rgba(59,130,246,0.22)',
  'rgba(234,179,8,0.22)',
  'rgba(249,115,22,0.22)',
  'rgba(239,68,68,0.24)',
];

/**
 * Y 軸レンジと {@link getWBGTLevel} の境界に合わせた背景帯（Recharts ReferenceArea 用）
 * @param {number} yMin
 * @param {number} yMax
 * @param {FillVariant} [variant]
 * @returns {{ y1: number, y2: number, fill: string, key: string }[]}
 */
export function wbgtYReferenceBandAreas(yMin, yMax, variant = 'light') {
  const fills = variant === 'dark' ? BAND_FILLS_DARK : BAND_FILLS_LIGHT;
  const lo = Math.min(yMin, yMax);
  const hi = Math.max(yMin, yMax);
  /** @type {{ y1: number, y2: number, fill: string, key: string }[]} */
  const areas = [];
  for (let i = 0; i < WBGT_BAND_EDGES.length + 1; i++) {
    const segLow = i === 0 ? -1e6 : WBGT_BAND_EDGES[i - 1];
    const segHigh = i >= WBGT_BAND_EDGES.length ? 1e6 : WBGT_BAND_EDGES[i];
    const y1 = Math.max(lo, segLow);
    const y2 = Math.min(hi, segHigh);
    if (y2 > y1) {
      areas.push({ y1, y2, fill: fills[i], key: `wbgt-band-${i}` });
    }
  }
  return areas;
}

/**
 * @param {number[]} timestamps ミリ秒（昇順想定）
 * @param {number} [maxTicks]
 * @returns {number[]}
 */
export function pickJwaChartXTicks(timestamps, maxTicks = 7) {
  const t = timestamps.filter(Number.isFinite);
  if (!t.length) return [];
  if (t.length <= maxTicks) return t;
  const step = Math.max(1, Math.floor((t.length - 1) / (maxTicks - 1)));
  const out = [];
  for (let i = 0; i < t.length; i += step) out.push(t[i]);
  if (out[out.length - 1] !== t[t.length - 1]) out.push(t[t.length - 1]);
  return out;
}

/**
 * 現在時刻を境に実線（〜現在）／破線（この先の予測）へ分割する行データ
 * @param {Array<{ wbgt: number, ts: number }>} points
 * @param {number} [nowMs]
 */
export function buildJwaChartRowsWithPastFutureSplit(points, nowMs = Date.now()) {
  const lastPastIdx = points.reduce((acc, p, i) => (p.ts <= nowMs ? i : acc), -1);
  const allFuture = lastPastIdx < 0;
  const allPast = lastPastIdx >= points.length - 1;
  const rows = points.map((p, i) => ({
    ...p,
    wbgtSolid: !allFuture && i <= lastPastIdx ? p.wbgt : null,
    wbgtForecast: !allPast && i >= lastPastIdx ? p.wbgt : null,
  }));
  const nowInRange =
    points.length > 0 && nowMs >= points[0].ts && nowMs <= points[points.length - 1].ts;
  return { rows, allPast, allFuture, nowInRange };
}

/**
 * ダッシュボードカード内の JWA 時別プレビュー用チャートデータ
 * @param {Array<{ time?: string|null, wbgtCelsius?: number|null }>} preview
 * @returns {{ wbgt: number, ts: number, short: string, timeLabel: string, level: ReturnType<typeof getWBGTLevel> }[]}
 */
export function buildJwaDashboardPreviewSeries(preview) {
  const arr = Array.isArray(preview) ? preview : [];
  /** @type {{ wbgt: number, ts: number, short: string, timeLabel: string, level: ReturnType<typeof getWBGTLevel> }[]} */
  const out = [];
  for (const p of arr) {
    const wbgt = p.wbgtCelsius != null ? Number(p.wbgtCelsius) : NaN;
    const ts = p.time ? Date.parse(String(p.time)) : NaN;
    if (!Number.isFinite(wbgt) || !Number.isFinite(ts)) continue;
    let short = '';
    try {
      short = new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } catch {
      short = '';
    }
    let timeLabel = '—';
    try {
      timeLabel = new Date(String(p.time)).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      timeLabel = String(p.time);
    }
    out.push({ wbgt, ts, short, timeLabel, level: getWBGTLevel(wbgt) });
  }
  out.sort((a, b) => a.ts - b.ts);
  return out;
}

/**
 * @param {{ wbgt: number }[]} points
 * @returns {[number, number]}
 */
export function wbgtChartYDomain(points) {
  if (!points.length) return [0, 10];
  const vals = points.map((d) => d.wbgt);
  return [Math.floor(Math.min(...vals) - 1), Math.ceil(Math.max(...vals) + 1)];
}
