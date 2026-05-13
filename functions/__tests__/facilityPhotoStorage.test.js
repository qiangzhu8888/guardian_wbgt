'use strict';

const {
  photoContentTypeToExt,
  parseManagedPhotoObjectPath,
} = require('../lib/facilityPhotoStorage');

describe('facilityPhotoStorage', () => {
  it('photoContentTypeToExt maps mime', () => {
    expect(photoContentTypeToExt('image/png')).toBe('png');
    expect(photoContentTypeToExt('image/jpeg')).toBe('jpg');
    expect(photoContentTypeToExt('image/jpeg; charset=binary')).toBe('jpg');
    expect(photoContentTypeToExt('image/svg+xml')).toBeNull();
    expect(photoContentTypeToExt('application/pdf')).toBeNull();
  });

  it('parseManagedPhotoObjectPath accepts firebasestorage URLs with org/facility prefix', () => {
    const u =
      'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/facility-installation-photos%2Forg-1%2F42%2Fx.png?alt=media&token=abc';
    expect(parseManagedPhotoObjectPath('my-bucket', 'org-1', '42', u)).toBe(
      'facility-installation-photos/org-1/42/x.png',
    );
  });

  it('parseManagedPhotoObjectPath rejects wrong bucket, prefix, facility, or host', () => {
    const good =
      'https://firebasestorage.googleapis.com/v0/b/bucket/o/facility-installation-photos%2Fa%2F9%2Fz.webp?alt=media&token=t';
    expect(parseManagedPhotoObjectPath('other', 'a', '9', good)).toBeNull();
    expect(parseManagedPhotoObjectPath('bucket', 'a', '99', good)).toBeNull();
    expect(parseManagedPhotoObjectPath('bucket', 'a', '9', 'https://evil.example/x')).toBeNull();
    const wrongPrefix =
      'https://firebasestorage.googleapis.com/v0/b/bucket/o/other%2Fa%2F9%2Fz.webp?alt=media&token=t';
    expect(parseManagedPhotoObjectPath('bucket', 'a', '9', wrongPrefix)).toBeNull();
  });
});
