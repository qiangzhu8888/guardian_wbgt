/**
 * WBGT（暑さ指数）計算ユーティリティ
 *
 * 気温・湿度のみからWBGTを推定（グローブ温度計なし）
 * 屋内または日陰想定の計算式
 *
 * 参考:
 *   湿球温度: Stull (2011), J. Appl. Meteor. Climatol.
 *   WBGT(屋内): 環境省・日本スポーツ協会の推定式を簡略化
 */

import { parseBuildicsMeasurements, parseBuildicsDeviceEntry } from './buildicsMeasurements.js';

export { parseBuildicsDeviceEntry, formatVoltageVolts } from './buildicsMeasurements.js';

/**
 * 湿球温度を気温・湿度から推定（Stull 2011）
 * @param {number} T  - 乾球温度 [℃]
 * @param {number} RH - 相対湿度 [%]
 * @returns {number} 湿球温度 [℃]
 */
export function calculateWetBulb(T, RH) {
  const Twb =
    T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;
  return Math.round(Twb * 10) / 10;
}

/**
 * WBGT推定値を計算（屋内・日陰向け簡易式）
 *   WBGT = 0.7 × Twb + 0.3 × T
 *   ※ 屋外・直射日光下では過小評価になる場合あり
 * @param {number} T  - 乾球温度 [℃]
 * @param {number} RH - 相対湿度 [%]
 * @returns {number} WBGT [℃] (小数第1位)
 */
export function calculateWBGT(T, RH) {
  const Twb = calculateWetBulb(T, RH);
  const wbgt = 0.7 * Twb + 0.3 * T;
  return Math.round(wbgt * 10) / 10;
}

/**
 * WBGT値から危険度レベルを返す
 * 環境省「熱中症予防情報サイト」の基準に準拠
 * @param {number} wbgt
 * @returns {'危険'|'厳重警戒'|'警戒'|'注意'|'ほぼ安全'}
 */
export function getWBGTLevel(wbgt) {
  if (wbgt >= 31) return '危険';
  if (wbgt >= 28) return '厳重警戒';
  if (wbgt >= 25) return '警戒';
  if (wbgt >= 21) return '注意';
  return 'ほぼ安全';
}

/**
 * ダッシュボード／詳細の「WBGT 指針」表用。* {@link getWBGTLevel} の境界と一致する文言。
 */
export const WBGT_ENV_GUIDELINES = Object.freeze([
  { badge: '危険', label: '危険 31℃以上' },
  { badge: '厳重警戒', label: '厳重警戒 28〜31℃' },
  { badge: '警戒', label: '警戒 25〜28℃' },
  { badge: '注意', label: '注意 21〜25℃' },
  { badge: 'ほぼ安全', label: 'ほぼ安全 21℃未満' },
]);

/**
 * BUILDICSの dataValue 文字列から温度・湿度（および typeUnit に V/v があれば電圧）を取得
 * @param {string} dataValue
 * @param {string} [typeUnit] BUILDICS typeUnit（例: "℃,%,V" または "℃,%,mV"）
 * @param {unknown} [latestRawData] BUILDICS latestRawData（alive JSON 等）
 * @returns {{ temp: number, humidity: number, voltage?: number } | null}
 */
export function parseDataValue(dataValue, typeUnit, latestRawData) {
  if (latestRawData != null && String(latestRawData).trim() !== '') {
    return parseBuildicsDeviceEntry({ dataValue, typeUnit, latestRawData }, latestRawData);
  }
  return parseBuildicsMeasurements(dataValue, typeUnit);
}
