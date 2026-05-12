'use strict';

const { validateFacilityPayload } = require('../lib/facilityValidation');

describe('facilityValidation', () => {
  it('accepts minimal valid payload', () => {
    expect(validateFacilityPayload(1, '校庭', 0, null, null, null)).toBe(null);
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
    expect(validateFacilityPayload(1, 'a', null, null, 35.1, 139.2)).toBe(null);
    expect(validateFacilityPayload(1, 'a', null, null, 'x', null)).toMatch(/緯度/);
  });
});
