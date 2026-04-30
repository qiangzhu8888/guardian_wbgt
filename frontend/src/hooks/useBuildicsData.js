import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateWBGT, getWBGTLevel, parseDataValue } from '../lib/wbgt';

const API_BASE = import.meta.env.DEV
  ? (import.meta.env.VITE_BUILDICS_API_BASE || '/buildics-api')
  : (import.meta.env.VITE_BUILDICS_PROXY_URL || '/api/buildics');

const DEV_API_KEY = import.meta.env.VITE_BUILDICS_API_KEY || '';

async function callBuildics(endpoint, body, signal) {
  if (import.meta.env.DEV) {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Apikey': DEV_API_KEY,
        'X-Apikey-Encoding': 'base64',
      },
      body: JSON.stringify(body),
      signal,
    });
  } else {
    return fetch(`${API_BASE}?path=${encodeURIComponent(endpoint)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  }
}

/**
 * BUILDICSセンサーデータをポーリング取得するカスタムフック
 *
 * sensorData[facilityId] の構造:
 * {
 *   status: 'ok' | 'stale' | 'no_data' | 'parse_error',
 *   temp, humidity, wbgt, level, updatedAt, updatedStr, isLive,
 *   history: [{ time, label, wbgt, temp, humidity }]  ← 過去6時間の全ポイント（新→古順）
 * }
 *
 * @param {Array<{ deviceId: string, facilityId: number }>} deviceMappings
 * @param {number} [intervalMs=60000] ポーリング間隔（ミリ秒）
 */
export function useBuildicsData(deviceMappings, intervalMs = 60000) {
  const [sensorData, setSensorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!deviceMappings || deviceMappings.length === 0) return;

    if (import.meta.env.DEV && !DEV_API_KEY) {
      setError('開発環境: APIキーが未設定です (.env.local の VITE_BUILDICS_API_KEY を確認)');
      setLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const now = Date.now();
      // 6時間分取得してグラフに使う
      const body = deviceMappings.map(({ deviceId }) => ({
        deviceId,
        startTime: now - 6 * 60 * 60 * 1000,
        endTime: now,
      }));

      const res = await callBuildics(
        '/common/device/queryDeviceData',
        body,
        abortRef.current.signal,
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const code = json.code ?? json.Code;
      if (code !== 200) throw new Error(json.msg ?? json.Msg ?? '取得エラー');

      const rawList = json.data ?? json.Data ?? [];

      const result = {};
      for (const mapping of deviceMappings) {
        const entries = rawList.filter(d => d.deviceId === mapping.deviceId);
        if (entries.length === 0) {
          result[mapping.facilityId] = { status: 'no_data' };
          continue;
        }

        // 時刻順（古→新）でソート
        const sorted = [...entries].sort(
          (a, b) => Number(a.latestDataTime) - Number(b.latestDataTime),
        );

        // 全ポイントをWBGT計算してhistoryに格納
        const history = sorted
          .map(entry => {
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

        // 最新ポイント
        const latest = history[history.length - 1];
        const updatedAt = new Date(latest.time);
        const isStale = Date.now() - updatedAt.getTime() > 10 * 60 * 1000;

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
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [deviceMappings, intervalMs]);

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
