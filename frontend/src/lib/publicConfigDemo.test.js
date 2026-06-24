import { describe, expect, it } from 'vitest';
import { isDemoOnlyPublicConfig } from './publicConfigDemo';

describe('isDemoOnlyPublicConfig', () => {
  it('returns true when every facility is mock', () => {
    expect(isDemoOnlyPublicConfig([{ isMock: true }, { isMock: true }])).toBe(true);
  });

  it('returns false when any facility is live', () => {
    expect(isDemoOnlyPublicConfig([{ isMock: true }, { isMock: false }])).toBe(false);
  });

  it('returns false for empty list', () => {
    expect(isDemoOnlyPublicConfig([])).toBe(false);
  });
});
