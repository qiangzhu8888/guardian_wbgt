import { describe, it, expect } from 'vitest';
import { normalizeUserOrgIds } from './AdminPlatformOrgs.jsx';

describe('normalizeUserOrgIds', () => {
  it('prefers explicit orgIds and merges primary orgId', () => {
    expect(
      normalizeUserOrgIds({ orgIds: ['a', 'b'], orgId: 'a' }),
    ).toEqual(['a', 'b']);
  });

  it('falls back when orgIds missing', () => {
    expect(normalizeUserOrgIds({ orgId: 'solo' })).toEqual(['solo']);
  });

  it('handles empty gracefully', () => {
    expect(normalizeUserOrgIds({})).toEqual([]);
  });
});
