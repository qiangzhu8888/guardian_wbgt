'use strict';

/**
 * 気温・湿度からの WBGT 推定（フロントの wbgt.js と同ロジック）
 * @param {number} T  - 乾球温度 [℃]
 * @param {number} RH - 相対湿度 [%]
 */
function calculateWetBulb(T, RH) {
  const Twb =
    T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;
  return Math.round(Twb * 10) / 10;
}

function calculateWBGT(T, RH) {
  const Twb = calculateWetBulb(T, RH);
  const wbgt = 0.7 * Twb + 0.3 * T;
  return Math.round(wbgt * 10) / 10;
}

/**
 * @param {number} wbgt
 * @returns {'危険'|'厳重警戒'|'警戒'|'注意'|'ほぼ安全'}
 */
function getWBGTLevel(wbgt) {
  if (wbgt >= 31) return '危険';
  if (wbgt >= 28) return '厳重警戒';
  if (wbgt >= 25) return '警戒';
  if (wbgt >= 21) return '注意';
  return 'ほぼ安全';
}

module.exports = {
  calculateWetBulb,
  calculateWBGT,
  getWBGTLevel,
};
