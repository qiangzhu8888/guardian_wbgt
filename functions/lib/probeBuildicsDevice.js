'use strict';

const { buildQueryPlan } = require('./buildicsQueryPlan');

const BUILDICS_API_BASE = 'https://www.buildics.jp/api';
const PROBE_HISTORY_HOURS = 48;

/**
 * BUILDICS に直近データがあるか（実機センサー想定の判定）
 * @param {string} apiKey
 * @param {string} deviceId
 * @returns {Promise<{ hasLiveData: boolean, status: 'ok' | 'no_data' | 'api_error' | 'skipped' }>}
 */
async function probeBuildicsDeviceHasLiveData(apiKey, deviceId) {
  const id = String(deviceId || '').trim();
  if (!apiKey || !/^\d{6,24}$/.test(id)) {
    return { hasLiveData: false, status: 'skipped' };
  }

  const now = Date.now();
  const { chunks } = buildQueryPlan([{ deviceId: id }], now, PROBE_HISTORY_HOURS, 1);
  const body = chunks[0];
  if (!body?.length) {
    return { hasLiveData: false, status: 'no_data' };
  }

  try {
    const upstream = await fetch(`${BUILDICS_API_BASE}/common/device/queryDeviceData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Apikey: apiKey,
        'X-Apikey-Encoding': 'base64',
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      return { hasLiveData: false, status: 'api_error' };
    }

    const json = await upstream.json();
    const code = json.code ?? json.Code;
    if (code !== 200) {
      return { hasLiveData: false, status: 'api_error' };
    }

    const list = json.data ?? json.Data ?? [];
    const has = list.some((row) => String(row.deviceId || row.DeviceId || '').trim() === id);
    return { hasLiveData: has, status: has ? 'ok' : 'no_data' };
  } catch {
    return { hasLiveData: false, status: 'api_error' };
  }
}

module.exports = { probeBuildicsDeviceHasLiveData, PROBE_HISTORY_HOURS };
