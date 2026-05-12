'use strict';

const jwt = require('jsonwebtoken');

/**
 * Firebase エミュレータでは FIRESTORE_EMULATOR_HOST が付与される一方、
 * FUNCTIONS_EMULATOR が true にならないケースがあるため、どちらかでローカル JWT フォールバックを有効にする。
 */
function isEmulatorRuntime() {
  if (process.env.FUNCTIONS_EMULATOR === 'true') return true;
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  return Boolean(host && String(host).trim());
}

function accessSecret() {
  return (
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    (isEmulatorRuntime() ? 'local-emulator-access-secret' : null)
  );
}

function refreshSecret() {
  return (
    process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET ||
    (isEmulatorRuntime() ? 'local-emulator-refresh-secret' : null)
  );
}

function signAccess(payload) {
  const sec = accessSecret();
  if (!sec) throw new Error('JWT access secret not configured');
  return jwt.sign(payload, sec, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

function signRefresh(payload) {
  const sec = refreshSecret();
  if (!sec) throw new Error('JWT refresh secret not configured');
  return jwt.sign({ ...payload, typ: 'refresh' }, sec, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

function verifyAccess(token) {
  const sec = accessSecret();
  if (!sec) throw new Error('JWT not configured');
  return jwt.verify(token, sec, { algorithms: ['HS256'] });
}

function verifyRefresh(token) {
  const sec = refreshSecret();
  if (!sec) throw new Error('JWT not configured');
  const d = jwt.verify(token, sec, { algorithms: ['HS256'] });
  if (d.typ !== 'refresh') throw new Error('invalid refresh');
  return d;
}

module.exports = {
  isEmulatorRuntime,
  accessSecret,
  refreshSecret,
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
};
