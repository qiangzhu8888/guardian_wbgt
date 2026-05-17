/**
 * 監視画面デモ用の擬似 WBGT 時系列（決定論的に再現可能）
 */

/** @param {number} seed */
function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 詳細画面「WBGT 推移グラフ」向けの過去トレンド（現在値へ収束）
 * @param {{ currentWbgt: number, seed: number, hours: number, stepMinutes?: number }} opts
 * @returns {{ label: string, wbgt: number, temp: null, humidity: null }[]}
 */
export function buildDemoWbgtTrendForDetail({ currentWbgt, seed, hours, stepMinutes = 30 }) {
  const w = Number(currentWbgt);
  if (!Number.isFinite(w) || w <= 0) return [];

  const rng = mulberry32(Number(seed) || 1);
  const n = Math.max(4, Math.ceil((hours * 60) / stepMinutes));
  const now = Date.now();
  const span = hours * 60 * 60 * 1000;
  const start = now - span;

  const jitter = (rng() - 0.5) * 4;
  const startWbgt = Math.max(17, Math.min(40, w + jitter));

  /** @type {{ label: string, wbgt: number, temp: null, humidity: null }[]} */
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const smooth = t * t * (3 - 2 * t);
    const bump = Math.sin(t * Math.PI) * (rng() - 0.5) * 1.4;
    let v = startWbgt + (w - startWbgt) * smooth + bump;
    v = Math.max(17, Math.min(42, v));
    const ts = start + (i / (n - 1)) * span;
    const label = new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    out.push({
      label,
      wbgt: Math.round(v * 10) / 10,
      temp: null,
      humidity: null,
    });
  }
  if (out.length) {
    out[out.length - 1] = { ...out[out.length - 1], wbgt: Math.round(w * 10) / 10 };
  }
  return out;
}

/**
 * ダッシュボード JWA 風ミニチャート用（ISO 時刻 + wbgtCelsius）
 * @param {{ currentWbgt: number, seed: number, pointCount?: number }} opts
 * @returns {{ time: string, wbgtCelsius: number }[]}
 */
export function buildDemoJwaMeshPreview({ currentWbgt, seed, pointCount = 13 }) {
  const w = Number(currentWbgt);
  if (!Number.isFinite(w) || w <= 0) return [];

  const rng = mulberry32(Number(seed) ^ 0x9e3779b9);
  const n = Math.max(5, Math.min(25, pointCount));
  const now = Date.now();
  const spanMs = 6 * 60 * 60 * 1000;
  const start = now - spanMs / 2;
  const end = now + spanMs / 2;

  const startW = w + (rng() - 0.5) * 5;
  /** @type {{ time: string, wbgtCelsius: number }[]} */
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const ts = start + t * (end - start);
    const smooth = t * t * (3 - 2 * t);
    const wave = (rng() - 0.5) * 1.1 * Math.sin(t * Math.PI);
    let val = startW + (w - startW) * smooth + wave;
    val = Math.max(17, Math.min(42, val));
    if (i === n - 1) val = w;
    out.push({
      time: new Date(ts).toISOString(),
      wbgtCelsius: Math.round(val * 10) / 10,
    });
  }
  return out;
}
