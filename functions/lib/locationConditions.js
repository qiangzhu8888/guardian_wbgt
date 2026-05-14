'use strict';

const { fetchOpenMeteoCurrent } = require('./openMeteoClient');
const { getWBGTLevel } = require('./wbgtIndoorEstimate');

/**
 * 管理画面などに返すユーザー向け短い説明（生ログ・レスポンス本文は含めない）
 * @param {unknown} err
 * @returns {string}
 */
function describeJwaFetchError(err) {
  if (!err || typeof err !== 'object') {
    return 'JWA API の取得に失敗しました';
  }
  const code = err.code;
  if (code === 'upstream_http') {
    const st = err.status;
    if (st === 401 || st === 403) {
      return 'JWA の認証に失敗しました。JWA_X_API_KEY / JWA_APIKEY の値（引用符なし・キー名の誤りなし）を確認してください。';
    }
    return typeof st === 'number' ? `JWA API がエラーを返しました（HTTP ${st}）。` : 'JWA API がエラーを返しました。';
  }
  if (code === 'upstream_network') {
    return 'JWA API へ接続できませんでした（ネットワーク・プロキシ・ファイアウォール）。';
  }
  if (code === 'invalid_json') {
    return 'JWA の応答を JSON として解釈できませんでした。';
  }
  if (typeof err.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }
  return 'JWA API の取得に失敗しました';
}

/**
 * @param {Array<{ time?: string | null, wbgtCelsius?: number | null, level?: string | null }>} rows
 * @param {number} [nowMs]
 */
function pickNearestHourlyRow(rows, nowMs = Date.now()) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const withT = rows
    .map((r) => ({ r, t: r.time ? Date.parse(String(r.time)) : NaN }))
    .filter((x) => Number.isFinite(x.t));
  if (withT.length === 0) return rows[0];
  let best = withT[0];
  let bestDist = Math.abs(best.t - nowMs);
  for (let i = 1; i < withT.length; i += 1) {
    const x = withT[i];
    const d = Math.abs(x.t - nowMs);
    if (d < bestDist) {
      best = x;
      bestDist = d;
    }
  }
  return best.r;
}

/**
 * @param {{ lat: number, lng: number, jwaWbgt: object }} opts
 */
async function fetchLocationConditions({ lat, lng, jwaWbgt }) {
  const weather = await fetchOpenMeteoCurrent(lat, lng);

  /** @type {number | null} */
  let wbgtCelsius = null;
  /** @type {string | null} */
  let wbgtLevel = null;
  /** @type {'jwa' | 'unavailable'} */
  let wbgtSource = 'unavailable';
  let wbgtAttribution =
    '日本気象協会（JWA）1km メッシュ WBGT 時別予測（参考）。環境変数 JWA_X_API_KEY / JWA_APIKEY の設定と通信が必要です。';
  /** @type {string | null} */
  let wbgtForecastTime = null;

  const jwaConfigured = Boolean(jwaWbgt && jwaWbgt.isJwaConfigured && jwaWbgt.isJwaConfigured());
  /** @type {string | null} */
  let jwaMessage = null;

  if (!jwaConfigured) {
    jwaMessage =
      'JWA API キーが未設定です。functions/.env またはリポジトリ直下の .env に JWA_X_API_KEY と JWA_APIKEY を（キー名完全一致・値の前後に引用符なしで）設定し、Functions／エミュレータを再起動してください。本番は Firebase Secret です。';
  } else {
    try {
      const payload = await jwaWbgt.fetchHourlyForecastByPoint(lat, lng);
      if (payload && payload.error) {
        jwaMessage =
          typeof payload.message === 'string' && payload.message.trim()
            ? payload.message.trim()
            : 'JWA の応答形式が不正で、WBGT を解釈できませんでした。';
      } else if (!Array.isArray(payload.data) || payload.data.length === 0) {
        jwaMessage =
          'JWA の予測データが空でした。日本の 1km メッシュ外の座標では取得できない場合があります。緯度経度を確認してください。';
      } else {
        const row = pickNearestHourlyRow(payload.data);
        if (row && row.wbgtCelsius != null && !Number.isNaN(Number(row.wbgtCelsius))) {
          wbgtCelsius = Number(row.wbgtCelsius);
          wbgtForecastTime = row.time != null ? String(row.time) : null;
          wbgtLevel =
            row.level && String(row.level).trim()
              ? String(row.level)
              : getWBGTLevel(wbgtCelsius);
          wbgtSource = 'jwa';
          wbgtAttribution = '日本気象協会（JWA）1km メッシュ WBGT 時別予測（基準時刻に最も近い1時間値・参考）';
          jwaMessage = null;
        } else {
          jwaMessage = 'JWA から時系列は返りましたが、有効な WBGT 値を選べませんでした。';
        }
      }
    } catch (e) {
      console.error('locationConditions jwa', e && e.message);
      jwaMessage = describeJwaFetchError(e);
    }
  }

  return {
    tempCelsius: weather.tempCelsius,
    humidityPercent: weather.humidityPercent,
    weatherTime: weather.time,
    wbgtCelsius,
    wbgtLevel,
    wbgtForecastTime,
    wbgtSource,
    weatherAttribution: 'Open-Meteo（現在値・参考）',
    wbgtAttribution,
    jwaConfigured,
    jwaMessage,
  };
}

module.exports = {
  fetchLocationConditions,
  pickNearestHourlyRow,
  describeJwaFetchError,
};
