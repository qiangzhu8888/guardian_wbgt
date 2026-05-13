'use strict';

const crypto = require('crypto');
const admin = require('firebase-admin');

/** @type {Readonly<Record<string, string>>} */
const MIME_TO_EXT = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
});

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * @param {string} contentType
 * @returns {string | null}
 */
function logoContentTypeToExt(contentType) {
  const ct = String(contentType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  return MIME_TO_EXT[ct] || null;
}

/**
 * @param {string} bucketName
 * @param {string} orgId
 * @param {unknown} logoUrl
 * @returns {string | null}
 */
function parseGcsPublicOrgLogoPath(bucketName, orgId, logoUrl) {
  if (!logoUrl || typeof logoUrl !== 'string') return null;
  let u;
  try {
    u = new URL(logoUrl.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.hostname !== 'storage.googleapis.com') return null;
  const p = u.pathname.split('/').filter(Boolean);
  if (p.length < 4) return null;
  if (p[0] !== bucketName) return null;
  if (p[1] !== 'org-logos') return null;
  if (p[2] !== orgId) return null;
  return p.slice(1).join('/');
}

/**
 * Firebase Storage の download token URL（v0/b/.../o/...?alt=media&token=）
 * @param {string} bucketName
 * @param {string} orgId
 * @param {unknown} logoUrl
 * @returns {string | null}
 */
function parseFirebasestorageOrgLogoPath(bucketName, orgId, logoUrl) {
  if (!logoUrl || typeof logoUrl !== 'string') return null;
  let u;
  try {
    u = new URL(logoUrl.trim());
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
  const prefix = `org-logos/${orgId}/`;
  if (!objectPath.startsWith(prefix)) return null;
  return objectPath;
}

/**
 * 当該バケットで org 管理アップロードであれば GCS オブジェクトパスを返す。
 * @param {string} bucketName
 * @param {string} orgId
 * @param {unknown} logoUrl
 * @returns {string | null}
 */
function parseManagedLogoObjectPath(bucketName, orgId, logoUrl) {
  return (
    parseGcsPublicOrgLogoPath(bucketName, orgId, logoUrl) ||
    parseFirebasestorageOrgLogoPath(bucketName, orgId, logoUrl)
  );
}

/**
 * @param {string} bucketName
 * @param {string} objectPath
 * @param {string} token
 * @returns {string}
 */
function buildFirebaseDownloadLogoUrl(bucketName, objectPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

/**
 * @param {string} orgId
 * @param {Buffer} buffer
 * @param {string} contentType
 * @returns {Promise<{ logoUrl: string, objectPath: string }>}
 */
async function uploadOrgLogoBuffer(orgId, buffer, contentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const e = new Error('empty logo');
    e.code = 'LOGO_EMPTY';
    throw e;
  }
  if (buffer.length > MAX_LOGO_BYTES) {
    const e = new Error('logo too large');
    e.code = 'LOGO_TOO_LARGE';
    throw e;
  }
  const ext = logoContentTypeToExt(contentType);
  if (!ext) {
    const e = new Error('unsupported logo type');
    e.code = 'LOGO_TYPE';
    throw e;
  }
  if (!admin.apps.length) {
    const e = new Error('firebase admin not initialized');
    e.code = 'ADMIN_INIT';
    throw e;
  }
  const bucket = admin.storage().bucket();
  const oid = String(orgId || '').trim();
  if (!oid) {
    const e = new Error('no org');
    e.code = 'NO_ORG';
    throw e;
  }
  const objectPath = `org-logos/${oid}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
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

  const logoUrl = buildFirebaseDownloadLogoUrl(bucket.name, objectPath, downloadToken);
  return { logoUrl, objectPath };
}

/**
 * @param {string} orgId
 * @param {unknown} logoUrl
 * @returns {Promise<void>}
 */
async function deleteManagedOrgLogoObject(orgId, logoUrl) {
  if (!admin.apps.length) return;
  const bucket = admin.storage().bucket();
  const path = parseManagedLogoObjectPath(bucket.name, orgId, logoUrl);
  if (!path) return;
  try {
    await bucket.file(path).delete({ ignoreNotFound: true });
  } catch (e) {
    console.error('org logo delete failed', e);
  }
}

module.exports = {
  MAX_LOGO_BYTES,
  MIME_TO_EXT,
  logoContentTypeToExt,
  parseManagedLogoObjectPath,
  parseGcsPublicOrgLogoPath,
  parseFirebasestorageOrgLogoPath,
  buildFirebaseDownloadLogoUrl,
  uploadOrgLogoBuffer,
  deleteManagedOrgLogoObject,
};
