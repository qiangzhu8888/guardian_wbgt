'use strict';

const {
  logoContentTypeToExt,
  parseManagedLogoObjectPath,
} = require('../lib/orgLogoStorage');

describe('orgLogoStorage', () => {
  it('logoContentTypeToExt maps mime', () => {
    expect(logoContentTypeToExt('image/png')).toBe('png');
    expect(logoContentTypeToExt('image/jpeg')).toBe('jpg');
    expect(logoContentTypeToExt('image/jpeg; charset=binary')).toBe('jpg');
    expect(logoContentTypeToExt('image/svg+xml')).toBe('svg');
    expect(logoContentTypeToExt('application/pdf')).toBeNull();
  });

  it('parseManagedLogoObjectPath accepts storage.googleapis.com org paths', () => {
    const u =
      'https://storage.googleapis.com/my-bucket/org-logos/org-1/abc.png';
    expect(parseManagedLogoObjectPath('my-bucket', 'org-1', u)).toBe('org-logos/org-1/abc.png');
  });

  it('parseManagedLogoObjectPath accepts firebasestorage download URLs', () => {
    const u =
      'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/org-logos%2Forg-1%2Fx.png?alt=media&token=abc';
    expect(parseManagedLogoObjectPath('my-bucket', 'org-1', u)).toBe('org-logos/org-1/x.png');
  });

  it('parseManagedLogoObjectPath rejects wrong bucket, host, or org', () => {
    const u =
      'https://storage.googleapis.com/other/org-logos/org-1/abc.png';
    expect(parseManagedLogoObjectPath('my-bucket', 'org-1', u)).toBeNull();
    expect(parseManagedLogoObjectPath('my-bucket', 'org-2', 'https://storage.googleapis.com/my-bucket/org-logos/org-1/a.png')).toBeNull();
    expect(parseManagedLogoObjectPath('my-bucket', 'org-1', 'https://evil.example/x')).toBeNull();
  });
});
