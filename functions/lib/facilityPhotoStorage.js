'use strict';

const crypto = require('crypto');
const admin = require('firebase-admin');

/** 設置場所用（SVG 不可・ラスタのみ） */
const MIME_TO_EXT = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
});

const MAX_BYTES = 5 * 1024 * 1024;

const PATH_PREFIX = 'facility-installation-photos';

/**
 * @param {string} contentType
 * @returns {string | null}
 */
function photoContentTypeToExt(contentType) {
  const ct = String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  return MIME_TO_EXT[ct] || null;
}

/**
 * @param {string} bucketName
 * @param {string} objectPath
 * @param {string} token
 */
function buildFirebaseDownloadUrl(bucketName, objectPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

/**
 * @param {string} bucketName
 * @param {string} orgId
 * @param {string} facilityId numeric string
 * @param {unknown} photoUrl
 * @returns {string | null}
 */
function parseManagedPhotoObjectPath(bucketName, orgId, facilityId, photoUrl) {
  if (!photoUrl || typeof photoUrl !== 'string') return null;
  let u;
  try {
    u = new URL(photoUrl.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.hostname !== 'firebasestorage.googleapis.com') return null;
  const m = u.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
  if (!m) return null;
  let urlBucket;
  try {
    urlBucket = decodeURIComponent(m[1]);
  } catch {
    return null;
  }
  if (urlBucket !== bucketName) return null;
  let objectPath;
  try {
    objectPath = decodeURIComponent(m[2]);
  } catch {
    return null;
  }
  const prefix = `${PATH_PREFIX}/${String(orgId).trim()}/${String(facilityId).trim()}/`;
  if (!objectPath.startsWith(prefix)) return null;
  return objectPath;
}

/**
 * @param {string} orgId
 * @param {string | number} facilityId
 * @param {Buffer} buffer
 * @param {string} contentType
 */
async function uploadFacilityInstallationPhotoBuffer(orgId, facilityId, buffer, contentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const e = new Error('empty photo');
    e.code = 'PHOTO_EMPTY';
    throw e;
  }
  if (buffer.length > MAX_BYTES) {
    const e = new Error('photo too large');
    e.code = 'PHOTO_TOO_LARGE';
    throw e;
  }
  const ext = photoContentTypeToExt(contentType);
  if (!ext) {
    const e = new Error('unsupported photo type');
    e.code = 'PHOTO_TYPE';
    throw e;
  }
  if (!admin.apps.length) {
    const e = new Error('firebase admin not initialized');
    e.code = 'ADMIN_INIT';
    throw e;
  }
  const bucket = admin.storage().bucket();
  const oid = String(orgId || '').trim();
  const fid = String(facilityId || '').trim();
  if (!oid || !fid) {
    const e = new Error('no scope');
    e.code = 'NO_SCOPE';
    throw e;
  }
  const objectPath = `${PATH_PREFIX}/${oid}/${fid}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const file = bucket.file(objectPath);
  const ct = String(contentType).split(';')[0].trim();
  const downloadToken = crypto.randomUUID();

  await file.save(buffer, {
    metadata: {
      contentType: ct,
      cacheControl: 'public, max-age=31536000',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
    resumable: false,
  });

  const installationPhotoUrl = buildFirebaseDownloadUrl(bucket.name, objectPath, downloadToken);
  return { installationPhotoUrl, objectPath };
}

/**
 * @param {string} orgId
 * @param {string | number} facilityId
 * @param {unknown} photoUrl
 */
async function deleteManagedFacilityInstallationPhoto(orgId, facilityId, photoUrl) {
  if (!admin.apps.length) return;
  const bucket = admin.storage().bucket();
  const path = parseManagedPhotoObjectPath(bucket.name, orgId, facilityId, photoUrl);
  if (!path) return;
  try {
    await bucket.file(path).delete({ ignoreNotFound: true });
  } catch (e) {
    console.error('facility installation photo delete failed', e);
  }
}

module.exports = {
  PATH_PREFIX,
  MAX_BYTES,
  MIME_TO_EXT,
  photoContentTypeToExt,
  parseManagedPhotoObjectPath,
  buildFirebaseDownloadUrl,
  uploadFacilityInstallationPhotoBuffer,
  deleteManagedFacilityInstallationPhoto,
};
