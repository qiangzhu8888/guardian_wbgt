'use strict';

const {
  FACILITY_PLACEMENT_TYPES,
  toStoredFacilityPlacementType,
  validateFacilityPlacementTypeInput,
} = require('../lib/facilityPlacementType');

describe('facilityPlacementType', () => {
  it('toStoredFacilityPlacementType: empty → unknown', () => {
    expect(toStoredFacilityPlacementType(undefined)).toBe('unknown');
    expect(toStoredFacilityPlacementType(null)).toBe('unknown');
    expect(toStoredFacilityPlacementType('')).toBe('unknown');
  });

  it('toStoredFacilityPlacementType: valid keys', () => {
    for (const t of FACILITY_PLACEMENT_TYPES) {
      expect(toStoredFacilityPlacementType(t)).toBe(t);
    }
  });

  it('toStoredFacilityPlacementType: typo → unknown (safe fallback)', () => {
    expect(toStoredFacilityPlacementType('Outdoor')).toBe('unknown');
  });

  it('validateFacilityPlacementTypeInput: empty ok', () => {
    expect(validateFacilityPlacementTypeInput(undefined)).toBe(null);
    expect(validateFacilityPlacementTypeInput(null)).toBe(null);
    expect(validateFacilityPlacementTypeInput('')).toBe(null);
    expect(validateFacilityPlacementTypeInput('  ')).toBe(null);
  });

  it('validateFacilityPlacementTypeInput: rejects unknown token', () => {
    expect(validateFacilityPlacementTypeInput('mars')).toMatch(/設置区分/);
  });
});
