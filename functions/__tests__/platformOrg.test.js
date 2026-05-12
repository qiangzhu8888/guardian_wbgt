'use strict';

const {
  isValidOrgIdForDoc,
  createOrgDocument,
  stripOrgForList,
} = require('../lib/platformOrg');

describe('platformOrg', () => {
  it('isValidOrgIdForDoc', () => {
    expect(isValidOrgIdForDoc('kitasato-2025')).toBe(true);
    expect(isValidOrgIdForDoc('Kit')).toBe(false);
    expect(isValidOrgIdForDoc('')).toBe(false);
  });

  it('createOrgDocument creates when db allows', async () => {
    const orgRefState = { exists: false };
    const db = {
      collection: (name) => {
        if (name !== 'orgs') throw new Error('unexpected collection');
        return {
          where: () => ({
            limit: () => ({
              get: async () => ({ empty: true }),
            }),
          }),
          doc: (id) => ({
            get: async () => ({ exists: orgRefState.exists }),
            set: async (payload) => {
              orgRefState.exists = true;
              orgRefState.id = id;
              orgRefState.payload = payload;
            },
          }),
        };
      },
    };
    const r = await createOrgDocument(db, { orgId: 'acme', slug: 'acme-corp', name: 'ACME' });
    expect(r).toEqual({ orgId: 'acme', slug: 'acme-corp' });
    expect(orgRefState.payload.slug).toBe('acme-corp');
  });

  it('stripOrgForList omits secrets', () => {
    const s = stripOrgForList('x', {
      slug: 's',
      name: 'n',
      buildicsApiKey: 'secret',
    });
    expect(s.buildicsApiKey).toBeUndefined();
    expect(s.orgId).toBe('x');
  });
});
