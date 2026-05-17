'use strict';

/** 環境省指針ベース・フロントの `frontend/src/lib/wbgt.js` と整合 */
function calculateWetBulb(T, RH) {
  const Twb =
    T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * RH ** 1.5 * Math.atan(0.023101 * RH) -
    4.686035;
  return Math.round(Twb * 10) / 10;
}

function calculateWBGT(T, RH) {
  const Twb = calculateWetBulb(T, RH);
  const wbgt = 0.7 * Twb + 0.3 * T;
  return Math.round(wbgt * 10) / 10;
}

function parseDataValue(dataValue) {
  if (!dataValue || typeof dataValue !== 'string') return null;
  const parts = dataValue.split(',');
  if (parts.length < 2) return null;
  const temp = Number.parseFloat(parts[0]);
  const humidity = Number.parseFloat(parts[1]);
  if (!Number.isFinite(temp) || !Number.isFinite(humidity)) return null;
  return { temp, humidity };
}

function getWBGTLevel(wbgt) {
  if (wbgt >= 31) return '危険';
  if (wbgt >= 28) return '厳重警戒';
  if (wbgt >= 25) return '警戒';
  if (wbgt >= 21) return '注意';
  return 'ほぼ安全';
}

/** `{ 危険: 0, ...}` より小さいほど状態が深刻 */
const LEVEL_ORDER = {
  危険: 0,
  厳重警戒: 1,
  警戒: 2,
  注意: 3,
  ほぼ安全: 4,
  通信異常: 5,
};

/** @returns {boolean} cur が min 以上ひどい（含む／同等以上なら通知） */
function levelMeetsMinimumThreshold(level, minConfigured) {
  const a = LEVEL_ORDER[level];
  const b = LEVEL_ORDER[minConfigured];
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  /** 両方とも「危険度が低い側」ほど順位が高いので、トリガ下限以下（数値でいうとより小さい方が悪い） */
  return a <= b;
}

module.exports = {
  calculateWBGT,
  parseDataValue,
  getWBGTLevel,
  LEVEL_ORDER,
  levelMeetsMinimumThreshold,
};
