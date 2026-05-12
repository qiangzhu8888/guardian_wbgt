'use strict';

const {
  mergeOrgDashboardIntoConfig,
  parseLogoUrl,
  parseThemePrimary,
  getBuildicsApiKeyForLedger,
  normalizeBuildicsApiKeyPatch,
  buildAdminOrgSettingsResponse,
} = require('../lib/orgDashboardMerge');

describe('orgDashboardMerge', () => {
  const base = {
    title: 'Default Title',
    subtitle: 'Sub',
    orgId: 'default',
  };

  it('mergeOrgDashboardIntoConfig overwrites title and never exposes buildicsApiKey', () => {
    const out = mergeOrgDashboardIntoConfig({ ...base }, {
      dashboardTitle: '  Hello  ',
      dashboardSubtitle: 'World',
      themePrimary: '#aabbcc',
      logoUrl: 'https://storage.googleapis.com/b/logo.png',
      buildicsApiKey: 'secret',
    });
    expect(out.title).toBe('Hello');
    expect(out.subtitle).toBe('World');
    expect(out.themePrimary).toBe('#AABBCC');
    expect(out.logoUrl).toBe('https://storage.googleapis.com/b/logo.png');
    expect(out.buildicsApiKey).toBeUndefined();
  });

  it('mergeOrgDashboardIntoConfig ignores invalid theme and http logo', () => {
    const out = mergeOrgDashboardIntoConfig({ ...base }, {
      themePrimary: 'red',
      logoUrl: 'http://storage.googleapis.com/x.png',
    });
    expect(out.themePrimary).toBeUndefined();
    expect(out.logoUrl).toBeUndefined();
    expect(out.title).toBe('Default Title');
  });

  it('parseLogoUrl allows *.googleapis.com', () => {
    expect(parseLogoUrl('https://x.googleapis.com/logo.png')).toBe('https://x.googleapis.com/logo.png');
  });

  it('parseThemePrimary normalizes case', () => {
    expect(parseThemePrimary('#a1b2c3')).toBe('#A1B2C3');
  });

  describe('getBuildicsApiKeyForLedger', () => {
    const orig = process.env.BUILDICS_API_KEY;

    afterEach(() => {
      if (orig === undefined) delete process.env.BUILDICS_API_KEY;
      else process.env.BUILDICS_API_KEY = orig;
    });

    it('prefers org document trimmed key', async () => {
      process.env.BUILDICS_API_KEY = 'env-key';
      const db = {
        collection: () => ({
          doc: () => ({
            get: async () => ({
              exists: true,
              data: () => ({ buildicsApiKey: '  org-only  ' }),
            }),
          }),
        }),
      };
      await expect(getBuildicsApiKeyForLedger(db, 'org1')).resolves.toBe('org-only');
    });

    it('falls back to env when org empty', async () => {
      process.env.BUILDICS_API_KEY = 'env-key';
      const db = {
        collection: () => ({
          doc: () => ({
            get: async () => ({
              exists: true,
              data: () => ({ buildicsApiKey: '   ' }),
            }),
          }),
        }),
      };
      await expect(getBuildicsApiKeyForLedger(db, 'org1')).resolves.toBe('env-key');
    });

    it('falls back when doc missing', async () => {
      process.env.BUILDICS_API_KEY = 'fallback';
      const db = {
        collection: () => ({
          doc: () => ({
            get: async () => ({ exists: false }),
          }),
        }),
      };
      await expect(getBuildicsApiKeyForLedger(db, 'org1')).resolves.toBe('fallback');
    });
  });

  describe('normalizeBuildicsApiKeyPatch', () => {
    it('skips when key absent', () => {
      expect(normalizeBuildicsApiKeyPatch({})).toEqual({ action: 'skip' });
    });
    it('clears on empty string', () => {
      expect(normalizeBuildicsApiKeyPatch({ buildicsApiKey: '' })).toEqual({ action: 'clear' });
    });
    it('sets trimmed value', () => {
      expect(normalizeBuildicsApiKeyPatch({ buildicsApiKey: ' abc ' })).toEqual({
        action: 'set',
        value: 'abc',
      });
    });
  });

  describe('buildAdminOrgSettingsResponse', () => {
    it('masks api key', () => {
      const r = buildAdminOrgSettingsResponse('oid', {
        slug: 's',
        buildicsApiKey: 'mysecretkey',
      });
      expect(r.buildicsApiKeyConfigured).toBe(true);
      expect(r.buildicsApiKeyLast4).toBe('tkey');
      expect(r).not.toHaveProperty('buildicsApiKey');
    });
  });
});
