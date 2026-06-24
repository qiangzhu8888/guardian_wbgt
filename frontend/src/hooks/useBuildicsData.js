import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateWBGT, getWBGTLevel } from '../lib/wbgt';
import { parseBuildicsMeasurements, resolveDeviceVoltage } from '../lib/buildicsMeasurements';
import { resolveLastKnownBattery } from '../lib/lastKnownBattery';
import { buildApGatewayStatusBody, buildGatewayBatteryByDeviceId } from '../lib/gatewayBattery';
import { buildBuildicsProxyUrl } from '../lib/publicApi';
import { buildQueryPlan } from '../lib/buildicsQueryPlan';

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
 * @param {string | undefined} orgSlug BFF 台帳スコープ用（/tenant/:orgSlug）
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
  const batteryCacheRef = useRef(new Map());

  const fetchData = useCallback(async () => {
    if (!deviceMappings || deviceMappings.length === 0) {
      setSensorData({});
      setError(null);
      setLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const now = Date.now();
      const { chunks, latestChunks, uniqueDeviceIds } = buildQueryPlan(
        deviceMappings,
        now,
        historyHours,
        chunkSize,
      );

      let rawList = [];
      let snapshotList = [];
      let gatewayList = [];

      async function fetchBuildicsEndpoint(endpoint, body) {
        let lastHttpErr;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          if (signal.aborted) return null;
          try {
            const res = await callBuildics(endpoint, body, signal, orgSlug);
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
            return json.data ?? json.Data ?? [];
          } catch (err) {
            if (err.name === 'AbortError') return null;
            lastHttpErr = err;
            await sleep(400 * 2 ** attempt);
          }
        }
        throw lastHttpErr;
      }

      async function fetchChunkList(chunkBodies) {
        const merged = [];
        for (const chunk of chunkBodies) {
          const list = await fetchBuildicsEndpoint('/common/device/queryDeviceData', chunk);
          if (list == null) return null;
          merged.push(...list);
        }
        return merged;
      }

      rawList = (await fetchChunkList(chunks)) ?? [];
      if (signal.aborted) return;

      snapshotList = (await fetchChunkList(latestChunks)) ?? [];
      if (signal.aborted) return;

      try {
        gatewayList =
          (await fetchBuildicsEndpoint(
            '/common/apgateway/status',
            buildApGatewayStatusBody(now),
          )) ?? [];
      } catch {
        gatewayList = [];
      }
      if (signal.aborted) return;

      const gatewayBatteryByDevice = buildGatewayBatteryByDeviceId(gatewayList, uniqueDeviceIds);

      const snapshotByDevice = new Map();
      for (const row of snapshotList) {
        const id = String(row.deviceId || row.DeviceId || '').trim();
        if (!id) continue;
        const prev = snapshotByDevice.get(id);
        const ts = Number(row.latestDataTime || row.LatestDataTime);
        const prevTs = prev ? Number(prev.latestDataTime || prev.LatestDataTime) : NaN;
        if (!prev || (Number.isFinite(ts) && ts >= prevTs)) {
          snapshotByDevice.set(id, row);
        }
      }

      const staleMs = staleMinutes * 60 * 1000;
      const result = {};
      for (const mapping of deviceMappings) {
        const deviceId = String(mapping.deviceId || '').trim();
        const entries = rawList.filter(
          (d) => String(d.deviceId || d.DeviceId || '').trim() === deviceId,
        );
        if (entries.length === 0) {
          result[mapping.facilityId] = { status: 'no_data' };
          continue;
        }

        const sorted = [...entries].sort(
          (a, b) => Number(a.latestDataTime || a.LatestDataTime) - Number(b.latestDataTime || b.LatestDataTime),
        );

        const snapshot = snapshotByDevice.get(deviceId);
        const voltageSourceEntries = snapshot ? [...sorted, snapshot] : sorted;
        const freshVoltage = resolveDeviceVoltage(voltageSourceEntries);
        const freshPercent = gatewayBatteryByDevice.get(deviceId) ?? null;
        const battery = resolveLastKnownBattery(
          orgSlug,
          mapping.facilityId,
          { freshVoltage, freshPercent },
          batteryCacheRef.current,
        );

        const history = sorted
          .map((entry) => {
            const parsed = parseBuildicsMeasurements(entry.dataValue, entry.typeUnit);
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
              voltage: null,
              level: getWBGTLevel(wbgt),
            };
          })
          .filter(Boolean);

        if (history.length === 0) {
          result[mapping.facilityId] = { status: 'parse_error' };
          continue;
        }

        const latest = history[history.length - 1];
        if (Number.isFinite(battery.voltage)) {
          latest.voltage = battery.voltage;
        }
        const updatedAt = new Date(latest.time);
        const isStale = Date.now() - updatedAt.getTime() > staleMs;

        result[mapping.facilityId] = {
          status: isStale ? 'stale' : 'ok',
          temp: latest.temp,
          humidity: latest.humidity,
          voltage: battery.voltage,
          batteryPercent: battery.batteryPercent,
          batteryCached: battery.batteryCached,
          batterySource: battery.batterySource,
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
