'use strict';

const {
  isValidOrgSlug,
  normalizeOrgSlugQuery,
  defaultOrgSlug,
  resolvePublicOrg,
} = require('../lib/orgResolve');

describe('orgResolve', () => {
  const dbEmptyOrgs = {
    collection: () => ({
      where() {
        return this;
      },
      limit() {
        return this;
      },
      get: async () => ({ empty: true, docs: [] }),
    }),
  };

  it('validates slug pattern', () => {
    expect(isValidOrgSlug('school-a')).toBe(true);
    expect(isValidOrgSlug('a')).toBe(true);
    expect(isValidOrgSlug('')).toBe(false);
    expect(isValidOrgSlug('School')).toBe(false);
    expect(isValidOrgSlug('-x')).toBe(false);
  });

  it('normalizeOrgSlugQuery uses default when empty', () => {
    const prev = process.env.DEFAULT_ORG_SLUG;
    process.env.DEFAULT_ORG_SLUG = 'acme';
    try {
      expect(normalizeOrgSlugQuery('')).toBe('acme');
      expect(normalizeOrgSlugQuery(undefined)).toBe('acme');
    } finally {
      if (prev === undefined) delete process.env.DEFAULT_ORG_SLUG;
      else process.env.DEFAULT_ORG_SLUG = prev;
    }
  });

  it('resolvePublicOrg falls back to default org when orgs doc missing and slug is default', async () => {
    const prevId = process.env.DEFAULT_ORG_ID;
    const prevSlug = process.env.DEFAULT_ORG_SLUG;
    process.env.DEFAULT_ORG_ID = 'my-default';
    process.env.DEFAULT_ORG_SLUG = 'default';
    try {
      const r = await resolvePublicOrg(dbEmptyOrgs, 'default');
      expect(r).toEqual({ orgId: 'my-default', orgSlug: 'default' });
    } finally {
      if (prevId === undefined) delete process.env.DEFAULT_ORG_ID;
      else process.env.DEFAULT_ORG_ID = prevId;
      if (prevSlug === undefined) delete process.env.DEFAULT_ORG_SLUG;
      else process.env.DEFAULT_ORG_SLUG = prevSlug;
    }
  });

  it('resolvePublicOrg 404 for unknown slug when not default', async () => {
    const prevSlug = process.env.DEFAULT_ORG_SLUG;
    process.env.DEFAULT_ORG_SLUG = 'default';
    try {
      await expect(resolvePublicOrg(dbEmptyOrgs, 'unknown-tenant')).rejects.toMatchObject({
        httpStatus: 404,
      });
    } finally {
      if (prevSlug === undefined) delete process.env.DEFAULT_ORG_SLUG;
      else process.env.DEFAULT_ORG_SLUG = prevSlug;
    }
  });
});
