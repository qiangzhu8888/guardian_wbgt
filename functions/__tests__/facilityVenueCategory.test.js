'use strict';

const {
  FACILITY_VENUE_CATEGORIES,
  toStoredFacilityVenueCategory,
  validateFacilityVenueCategoryInput,
} = require('../lib/facilityVenueCategory');

describe('facilityVenueCategory', () => {
  it('toStoredFacilityVenueCategory: empty → unknown', () => {
    expect(toStoredFacilityVenueCategory(undefined)).toBe('unknown');
    expect(toStoredFacilityVenueCategory(null)).toBe('unknown');
    expect(toStoredFacilityVenueCategory('')).toBe('unknown');
  });

  it('toStoredFacilityVenueCategory: valid keys', () => {
    for (const t of FACILITY_VENUE_CATEGORIES) {
      expect(toStoredFacilityVenueCategory(t)).toBe(t);
    }
  });

  it('toStoredFacilityVenueCategory: typo → unknown', () => {
    expect(toStoredFacilityVenueCategory('FACTORY')).toBe('unknown');
  });

  it('validateFacilityVenueCategoryInput: empty ok', () => {
    expect(validateFacilityVenueCategoryInput(undefined)).toBe(null);
    expect(validateFacilityVenueCategoryInput('  ')).toBe(null);
  });

  it('validateFacilityVenueCategoryInput: rejects unknown token', () => {
    expect(validateFacilityVenueCategoryInput('airport')).toMatch(/場種/);
  });
});
