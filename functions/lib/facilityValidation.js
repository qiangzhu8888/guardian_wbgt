'use strict';

const MAX_NAME = 200;
const MAX_ADDRESS = 500;

/**
 * @returns {string|null} エラーメッセージ or null
 */
function validateFacilityPayload(facilityId, name, sortOrder, address, lat, lng) {
  const fid = Number(facilityId);
  if (!Number.isFinite(fid) || fid <= 0 || fid > 1e9) {
    return 'facilityId は 1 〜 10億未満の整数である必要があります';
  }
  if (typeof name !== 'string' || !name.trim()) {
    return '施設名（name）は必須です';
  }
  if (name.trim().length > MAX_NAME) {
    return '施設名が長すぎます';
  }
  if (sortOrder != null && !Number.isFinite(Number(sortOrder))) {
    return 'sortOrder が不正です';
  }
  if (address != null && String(address).length > MAX_ADDRESS) {
    return '住所が長すぎます';
  }
  if (lat != null && lat !== '' && !Number.isFinite(Number(lat))) {
    return '緯度 lat が不正です';
  }
  if (lng != null && lng !== '' && !Number.isFinite(Number(lng))) {
    return '経度 lng が不正です';
  }
  return null;
}

module.exports = {
  validateFacilityPayload,
  MAX_NAME,
  MAX_ADDRESS,
};
