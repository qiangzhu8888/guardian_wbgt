import { LEVEL_ORDER } from '../monitoring/levelStyles';
import { buildDemoJwaMeshPreview } from './demoWbgtSeries';

/**
 * @param {object} sensorData from useBuildicsData
 * @param {Array} mockFacilities from public config
 * @param {Array<{ deviceId: string, facilityId: number }>} deviceMappings
 */
export function mergeFacilities(sensorData, mockFacilities, deviceMappings) {
  const merged = (mockFacilities || []).map((f) => {
    const live = sensorData[f.id];
    if (!live || live.status === 'no_data' || live.status === 'parse_error') {
      const wbgt = Number(f?.wbgt);
      const isCommBad = f?.level === '通信異常' || !Number.isFinite(wbgt) || wbgt <= 0;
      const mockJwaPreview = isCommBad ? null : buildDemoJwaMeshPreview({ currentWbgt: wbgt, seed: Number(f.id) || 1 });
      return { ...f, ...(mockJwaPreview ? { mockJwaPreview } : {}) };
    }
    if (live.status === 'stale') {
      return { ...f, level: '通信異常', isMock: false, isLive: true };
    }
    return {
      ...f,
      wbgt: live.wbgt,
      level: live.level,
      temp: live.temp,
      humidity: live.humidity,
      updated: live.updatedStr,
      isMock: false,
      isLive: true,
      deviceId: deviceMappings.find((d) => d.facilityId === f.id)?.deviceId,
      wbgtNext: f.wbgtNext,
      history: live.history || [],
    };
  });
  return merged.sort((a, b) => {
    if (!a.isMock && b.isMock) return -1;
    if (a.isMock && !b.isMock) return 1;
    return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
  });
}
