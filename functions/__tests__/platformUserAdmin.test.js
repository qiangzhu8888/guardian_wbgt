'use strict';

const { stripUserForPlatformList } = require('../lib/platformUserAdmin');

describe('platformUserAdmin', () => {
  it('stripUserForPlatformList omits passwordHash', () => {
    const out = stripUserForPlatformList('u1', {
      email: 'a@b.c',
      orgId: 'o1',
      role: 'admin',
      passwordHash: 'secret',
      createdAt: 1,
    });
    expect(out).toEqual({
      userId: 'u1',
      email: 'a@b.c',
      orgId: 'o1',
      role: 'admin',
      createdAt: 1,
      updatedAt: null,
    });
    expect(out).not.toHaveProperty('passwordHash');
  });
});
