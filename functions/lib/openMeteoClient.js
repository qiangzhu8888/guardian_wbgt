'use strict';

/**
 * Open-Meteo 現在値（API キー不要）
 * @see https://open-meteo.com/
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ tempCelsius: number | null, humidityPercent: number | null, time: string | null }>}
 */
async function fetchOpenMeteoCurrent(lat, lng) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m');
  url.searchParams.set('timezone', 'Asia/Tokyo');
  let res;
  try {
    res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  } catch (err) {
    const e = new Error('気温・湿度データへの接続に失敗しました');
    e.code = 'open_meteo_network';
    e.cause = err;
    throw e;
  }
  let json;
  try {
    json = await res.json();
  } catch {
    const e = new Error('気温・湿度データの応答を解釈できませんでした');
    e.code = 'open_meteo_parse';
    throw e;
  }
  if (!res.ok) {
    const e = new Error('気温・湿度データの取得に失敗しました');
    e.code = 'open_meteo_http';
    e.status = res.status;
    throw e;
  }
  const cur = json && typeof json === 'object' ? json.current : null;
  if (!cur || cur.temperature_2m == null || Number.isNaN(Number(cur.temperature_2m))) {
    const e = new Error('気温・湿度データの形式が不正です');
    e.code = 'open_meteo_parse';
    throw e;
  }
  const tempCelsius = Math.round(Number(cur.temperature_2m) * 10) / 10;
  let humidityPercent = null;
  if (cur.relative_humidity_2m != null && !Number.isNaN(Number(cur.relative_humidity_2m))) {
    humidityPercent = Math.round(Number(cur.relative_humidity_2m));
  }
  return {
    tempCelsius,
    humidityPercent,
    time: cur.time != null ? String(cur.time) : null,
  };
}

module.exports = { fetchOpenMeteoCurrent };
