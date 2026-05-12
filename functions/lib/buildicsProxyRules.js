'use strict';

const ALLOWED_PATHS = new Set([
  '/common/device/queryDeviceData',
  '/common/apgateway/status',
]);

const MAX_BODY_JSON = 512 * 1024;
const DEVICE_ID_RE = /^\d{6,24}$/;

function validateDevicePayload(deviceId, facilityId, label) {
  if (!DEVICE_ID_RE.test(String(deviceId || ''))) {
    return 'deviceId は6〜24桁の数字である必要があります';
  }
  if (!Number.isFinite(Number(facilityId))) {
    return 'facilityId が不正です';
  }
  if (label != null && String(label).length > 200) {
    return 'label が長すぎます';
  }
  return null;
}

function extractDeviceIdsFromBuildicsBody(body) {
  if (!Array.isArray(body)) return [];
  return [...new Set(body.map((b) => String(b.deviceId || '').trim()).filter(Boolean))];
}

module.exports = {
  ALLOWED_PATHS,
  MAX_BODY_JSON,
  DEVICE_ID_RE,
  validateDevicePayload,
  extractDeviceIdsFromBuildicsBody,
};
