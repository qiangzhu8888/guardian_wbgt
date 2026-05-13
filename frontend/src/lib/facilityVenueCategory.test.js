import { describe, it, expect } from 'vitest';
import {
  FACILITY_VENUE_CATEGORIES,
  FACILITY_VENUE_CATEGORY_OPTIONS,
  facilityVenueCategoryLabel,
} from './facilityVenueCategory';

describe('facilityVenueCategory (frontend)', () => {
  it('FACILITY_VENUE_CATEGORY_OPTIONS covers all FACILITY_VENUE_CATEGORIES', () => {
    const values = FACILITY_VENUE_CATEGORY_OPTIONS.map((o) => o.value);
    for (const t of FACILITY_VENUE_CATEGORIES) {
      expect(values).toContain(t);
    }
    expect(values.length).toBe(FACILITY_VENUE_CATEGORIES.length);
  });

  it('facilityVenueCategoryLabel', () => {
    expect(facilityVenueCategoryLabel('nope')).toBe('未設定');
    expect(facilityVenueCategoryLabel('hospital_clinic')).toBe('病院・診療所');
  });
});
