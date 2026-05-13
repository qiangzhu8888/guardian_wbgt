'use strict';

const { normalizeAuthBootstrapSecret } = require('../lib/bootstrapSecretNormalize');

describe('normalizeAuthBootstrapSecret', () => {
  it('trims and strips BOM', () => {
    expect(normalizeAuthBootstrapSecret('\uFEFF  abc  ')).toBe('abc');
  });

  it('strips duplicated AUTH_BOOTSTRAP_SECRET= prefix', () => {
    expect(normalizeAuthBootstrapSecret('AUTH_BOOTSTRAP_SECRET=hello')).toBe('hello');
    expect(
      normalizeAuthBootstrapSecret(
        'AUTH_BOOTSTRAP_SECRET=AUTH_BOOTSTRAP_SECRET=hello',
      ),
    ).toBe('hello');
  });

  it('strips balanced outer quotes', () => {
    expect(normalizeAuthBootstrapSecret('"secret"')).toBe('secret');
    expect(normalizeAuthBootstrapSecret("'tick'")).toBe('tick');
  });

  it('returns empty for empty input', () => {
    expect(normalizeAuthBootstrapSecret('')).toBe('');
    expect(normalizeAuthBootstrapSecret(null)).toBe('');
  });
});
