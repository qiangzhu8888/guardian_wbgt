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
 * BUILDICSの dataValue 文字列から温度・湿度を取得
 * dataValue 形式: "温度,湿度"（例: "25.5,60.2"）
 * @param {string} dataValue
 * @returns {{ temp: number, humidity: number } | null}
 */
export function parseDataValue(dataValue) {
  if (!dataValue) return null;
  const parts = dataValue.split(',');
  if (parts.length < 2) return null;
  const temp = parseFloat(parts[0]);
  const humidity = parseFloat(parts[1]);
  if (isNaN(temp) || isNaN(humidity)) return null;
  return { temp, humidity };
}
