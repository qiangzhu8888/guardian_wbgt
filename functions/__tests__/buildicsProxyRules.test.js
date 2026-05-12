'use strict';

const {
  validateDevicePayload,
  extractDeviceIdsFromBuildicsBody,
} = require('../lib/buildicsProxyRules');

describe('buildicsProxyRules', () => {
  it('validateDevicePayload', () => {
    expect(validateDevicePayload('123456', 1, null)).toBe(null);
    expect(validateDevicePayload('12', 1, null)).toMatch(/deviceId/);
    expect(validateDevicePayload('123456', NaN, null)).toMatch(/facilityId/);
    expect(validateDevicePayload('123456', 1, 'x'.repeat(201))).toMatch(/label/);
  });

  it('extractDeviceIdsFromBuildicsBody dedupes', () => {
    expect(extractDeviceIdsFromBuildicsBody([{ deviceId: '1' }, { deviceId: '1' }, { deviceId: 2 }])).toEqual(['1', '2']);
    expect(extractDeviceIdsFromBuildicsBody(null)).toEqual([]);
  });
});
