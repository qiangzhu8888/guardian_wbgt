import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateWBGT, getWBGTLevel, parseDataValue } from '../lib/wbgt';
import { buildBuildicsProxyUrl } from '../lib/publicApi';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** VITE_BUILDICS_API_KEY があるときだけブラウザから BUILDICS に直結（開発用） */
function devUsesDirectBuildics() {
  return import.meta.env.DEV && Boolean((import.meta.env.VITE_BUILDICS_API_KEY || '').trim());
}

async function callBuildics(endpoint, body, signal, orgSlug) {
  if (devUsesDirectBuildics()) {
    const API_BASE = import.meta.env.VITE_BUILDICS_API_BASE || '/buildics-api';
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Apikey: import.meta.env.VITE_BUILDICS_API_KEY,
        'X-Apikey-Encoding': 'base64',
      },
      body: JSON.stringify(body),
      signal,
    });
  }
  const url = buildBuildicsProxyUrl(endpoint, orgSlug);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}

const defaultPolling = {
  historyHours: 6,
  staleMinutes: 10,
  chunkSize: 40,
  maxRetries: 3,
};

/**
 * @param {Array<{ deviceId: string, facilityId: number }>} deviceMappings
 * @param {number} intervalMs
 * @param {Partial<typeof defaultPolling>} pollingOpts
 * @param {string | undefined} orgSlug BFF 台帳スコープ用（/o/:orgSlug）
 */
export function useBuildicsData(deviceMappings, intervalMs = 60000, pollingOpts = {}, orgSlug) {
  const historyHours = pollingOpts.historyHours ?? defaultPolling.historyHours;
  const staleMinutes = pollingOpts.staleMinutes ?? defaultPolling.staleMinutes;
  const chunkSize = pollingOpts.chunkSize ?? defaultPolling.chunkSize;
  const maxRetries = pollingOpts.maxRetries ?? defaultPolling.maxRetries;

  const [sensorData, setSensorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const abortRef = useRef(null);
  const failStreakRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!deviceMappings || deviceMappings.length === 0) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const now = Date.now();
      const { chunks } = buildQueryPlan(deviceMappings, now, historyHours, chunkSize);

      let rawList = [];

      for (const chunk of chunks) {
        let lastHttpErr;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          if (signal.aborted) return;
          try {
            const res = await callBuildics('/common/device/queryDeviceData', chunk, signal, orgSlug);
            if (!res.ok) {
              lastHttpErr = new Error(`HTTP ${res.status}`);
              await sleep(400 * 2 ** attempt);
              continue;
            }
            const json = await res.json();
            const code = json.code ?? json.Code;
            if (code !== 200) {
              lastHttpErr = new Error(json.msg ?? json.Msg ?? '取得エラー');
              await sleep(400 * 2 ** attempt);
              continue;
            }
            const list = json.data ?? json.Data ?? [];
            rawList = rawList.concat(list);
            lastHttpErr = null;
            break;
          } catch (err) {
            if (err.name === 'AbortError') return;
            lastHttpErr = err;
            await sleep(400 * 2 ** attempt);
          }
        }
        if (lastHttpErr) throw lastHttpErr;
      }

      const staleMs = staleMinutes * 60 * 1000;
      const result = {};
      for (const mapping of deviceMappings) {
        const entries = rawList.filter((d) => d.deviceId === mapping.deviceId);
        if (entries.length === 0) {
          result[mapping.facilityId] = { status: 'no_data' };
          continue;
        }

        const sorted = [...entries].sort(
          (a, b) => Number(a.latestDataTime) - Number(b.latestDataTime),
        );

        const history = sorted
          .map((entry) => {
            const parsed = parseDataValue(entry.dataValue);
            if (!parsed) return null;
            const { temp, humidity } = parsed;
            const wbgt = calculateWBGT(temp, humidity);
            const dt = new Date(Number(entry.latestDataTime));
            return {
              time: Number(entry.latestDataTime),
              label: dt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
              wbgt,
              temp,
              humidity,
              level: getWBGTLevel(wbgt),
            };
          })
          .filter(Boolean);

        if (history.length === 0) {
          result[mapping.facilityId] = { status: 'parse_error' };
          continue;
        }

        const latest = history[history.length - 1];
        const updatedAt = new Date(latest.time);
        const isStale = Date.now() - updatedAt.getTime() > staleMs;

        result[mapping.facilityId] = {
          status: isStale ? 'stale' : 'ok',
          temp: latest.temp,
          humidity: latest.humidity,
          wbgt: latest.wbgt,
          level: isStale ? '通信異常' : latest.level,
          updatedAt,
          updatedStr: updatedAt.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isLive: true,
          history,
        };
      }

      setSensorData(result);
      setError(null);
      setLastFetched(new Date());
      failStreakRef.current = 0;
    } catch (err) {
      if (err.name === 'AbortError') return;
      failStreakRef.current += 1;
      if (failStreakRef.current >= 3) {
        setError('データ取得に繰り返し失敗しています。しばらくしてから再試行してください。');
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [deviceMappings, historyHours, staleMinutes, chunkSize, maxRetries, orgSlug]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, intervalMs);
    return () => {
      clearInterval(timer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData, intervalMs]);

  return { sensorData, loading, error, lastFetched, refresh: fetchData };
}
