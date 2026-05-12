import { describe, it, expect } from 'vitest';
import { buildQueryPlan } from './buildicsQueryPlan.js';

describe('buildQueryPlan', () => {
  it('dedupes deviceIds and chunks', () => {
    const now = 1_000_000_000_000;
    const mappings = [
      { deviceId: '111', facilityId: 1 },
      { deviceId: '111', facilityId: 1 },
      { deviceId: '222', facilityId: 2 },
    ];
    const { chunks, uniqueDeviceIds } = buildQueryPlan(mappings, now, 6, 1);
    expect(uniqueDeviceIds).toEqual(['111', '222']);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(1);
    expect(chunks[0][0].deviceId).toBe('111');
  });
});
