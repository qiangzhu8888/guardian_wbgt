import { describe, it, expect } from 'vitest';
import { normalizeUserOrgIds, reconcileMembershipIdsWithCatalog } from './AdminPlatformOrgs.jsx';

const catalog = [{ orgId: 'acme' }, { orgId: 'beta-corp' }];
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

describe('reconcileMembershipIdsWithCatalog', () => {
  it('maps casing to catalog orgId', () => {
    expect(reconcileMembershipIdsWithCatalog(['ACME'], catalog)).toEqual(['acme']);
  });

  it('merges known and unknown ids', () => {
    expect(reconcileMembershipIdsWithCatalog(['acme', 'legacy-Unknown'], catalog)).toEqual([
      'acme',
      'legacy-Unknown',
    ]);
  });

  it('dedupes after reconcile', () => {
    expect(reconcileMembershipIdsWithCatalog(['acme', 'ACME'], catalog)).toEqual(['acme']);
  });
});
