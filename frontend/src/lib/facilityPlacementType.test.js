import { describe, it, expect } from 'vitest';
import {
  FACILITY_PLACEMENT_TYPES,
  FACILITY_PLACEMENT_OPTIONS,
  facilityPlacementLabel,
} from './facilityPlacementType';

describe('facilityPlacementType (frontend)', () => {
  it('FACILITY_PLACEMENT_OPTIONS covers all FACILITY_PLACEMENT_TYPES', () => {
    const values = FACILITY_PLACEMENT_OPTIONS.map((o) => o.value);
    for (const t of FACILITY_PLACEMENT_TYPES) {
      expect(values).toContain(t);
    }
    expect(values.length).toBe(FACILITY_PLACEMENT_TYPES.length);
  });

  it('facilityPlacementLabel falls back for unknown tokens', () => {
    expect(facilityPlacementLabel('bogus')).toBe('未設定');
    expect(facilityPlacementLabel('outdoor')).toBe('屋外');
  });
});
