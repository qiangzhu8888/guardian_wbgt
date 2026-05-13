'use strict';

describe('userOrgScope', () => {
  /** @type {string | undefined} */
  let prevDefaultOrgId;

  beforeAll(() => {
    prevDefaultOrgId = process.env.DEFAULT_ORG_ID;
    process.env.DEFAULT_ORG_ID = 'fallback-org';
  });

  afterAll(() => {
    if (prevDefaultOrgId === undefined) delete process.env.DEFAULT_ORG_ID;
    else process.env.DEFAULT_ORG_ID = prevDefaultOrgId;
  });

  /** @typedef {typeof import('../lib/userOrgScope')} OrgScopeModule */
  let mod;

  beforeEach(() => {
    jest.resetModules();
    /** @type {OrgScopeModule} */
    mod = require('../lib/userOrgScope');
  });

  describe('normalizeOrgIds', () => {
    it('uses orgIds and orgId merged with current org first when orgId exists', () => {
      expect(mod.normalizeOrgIds({ orgId: 'primary', orgIds: ['a', 'primary', 'b'] })).toEqual([
        'primary',
        'a',
        'b',
      ]);
    });

    it('falls back when orgIds missing but orgId set', () => {
      expect(mod.normalizeOrgIds({ orgId: 'only' })).toEqual(['only']);
    });

    it('fills default when both missing', () => {
      expect(mod.normalizeOrgIds({})).toEqual(['fallback-org']);
    });

    it('uses explicit orgIds when orgId absent', () => {
      expect(mod.normalizeOrgIds({ orgIds: ['z', 'y'] })).toEqual(['z', 'y']);
    });

    it('returns default when neither orgId nor usable orgIds', () => {
      expect(mod.normalizeOrgIds({ orgIds: [] })).toEqual(['fallback-org']);
    });
  });

  describe('syncPrimaryOrgWithList', () => {
    it('pins preferred primary when listed', () => {
      expect(mod.syncPrimaryOrgWithList(['b', 'a', 'c'], 'a')).toEqual({
        orgId: 'a',
        orgIds: ['a', 'b', 'c'],
      });
    });

    it('drops invalid preferred primary', () => {
      expect(mod.syncPrimaryOrgWithList(['b', 'a'], 'x')).toEqual({
        orgId: 'b',
        orgIds: ['b', 'a'],
      });
    });
  });

  describe('userMayAccessOrg', () => {
    it('allows superadmin arbitrarily', () => {
      expect(mod.userMayAccessOrg({ orgId: 'a', orgIds: ['a'] }, 'other', { isSuperadmin: true })).toBe(true);
    });

    it('checks membership otherwise', () => {
      expect(mod.userMayAccessOrg({ orgId: 'a', orgIds: ['a', 'b'] }, 'b', {})).toBe(true);
      expect(mod.userMayAccessOrg({ orgId: 'a', orgIds: ['a'] }, 'b', {})).toBe(false);
    });
  });
});
