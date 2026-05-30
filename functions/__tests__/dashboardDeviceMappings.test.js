'use strict';

const {
  pickDashboardDeviceMappings,
  pickPreferredDashboardEntry,
} = require('../lib/dashboardDeviceMappings');

describe('dashboardDeviceMappings', () => {
  it('returns one mapping per facility', () => {
    const out = pickDashboardDeviceMappings([
      { deviceId: '111', facilityId: 1, dashboardDisplay: true },
      { deviceId: '222', facilityId: 1, dashboardDisplay: false },
      { deviceId: '333', facilityId: 2 },
    ]);
    expect(out).toEqual([
      { deviceId: '111', facilityId: 1 },
      { deviceId: '333', facilityId: 2 },
    ]);
  });

  it('prefers dashboardDisplay flag when unset on both', () => {
    const a = { deviceId: 'aaa', facilityId: 1, dashboardDisplay: false, updatedAt: 100 };
    const b = { deviceId: 'bbb', facilityId: 1, dashboardDisplay: true, updatedAt: 50 };
    expect(pickPreferredDashboardEntry(a, b).deviceId).toBe('bbb');
  });

  it('skips disabled devices', () => {
    const out = pickDashboardDeviceMappings([
      { deviceId: '111', facilityId: 1, disabled: true },
      { deviceId: '222', facilityId: 1 },
    ]);
    expect(out).toEqual([{ deviceId: '222', facilityId: 1 }]);
  });
});
