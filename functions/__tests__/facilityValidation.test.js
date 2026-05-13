'use strict';

const { validateFacilityPayload } = require('../lib/facilityValidation');

describe('facilityValidation', () => {
  it('accepts minimal valid payload', () => {
    expect(validateFacilityPayload(1, '校庭', 0, null, null, null, undefined, undefined)).toBe(null);
  });

  it('rejects invalid id', () => {
    expect(validateFacilityPayload(0, 'x', null, null, null, null)).toMatch(/facilityId/);
    expect(validateFacilityPayload('a', 'x', null, null, null, null)).toMatch(/facilityId/);
  });

  it('rejects empty name', () => {
    expect(validateFacilityPayload(1, '', null, null, null, null)).toMatch(/施設名/);
    expect(validateFacilityPayload(1, '   ', null, null, null, null)).toMatch(/施設名/);
  });
  it('validates lat lng', () => {
    expect(validateFacilityPayload(1, 'a', null, null, 35.1, 139.2, undefined, undefined)).toBe(null);
    expect(validateFacilityPayload(1, 'a', null, null, 'x', null, undefined, undefined)).toMatch(/緯度/);
  });

  it('validates placementType when provided', () => {
    expect(validateFacilityPayload(1, 'a', 0, '', null, null, 'outdoor', undefined)).toBe(null);
    expect(validateFacilityPayload(1, 'a', 0, '', null, null, 'invalid', undefined)).toMatch(/設置区分/);
  });

  it('validates venueCategory when provided', () => {
    expect(validateFacilityPayload(1, 'a', 0, '', null, null, undefined, 'factory')).toBe(null);
    expect(validateFacilityPayload(1, 'a', 0, '', null, null, undefined, 'zoo')).toMatch(/場種/);
  });
});
