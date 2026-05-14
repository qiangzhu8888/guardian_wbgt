'use strict';

const { loadFunctionsDotEnv } = require('./lib/loadLocalEnv');
loadFunctionsDotEnv();

const { defineSecret } = require('firebase-functions/params');
const jwaXApiKeySecret = defineSecret('JWA_X_API_KEY');
const jwaApikeySecret = defineSecret('JWA_APIKEY');

const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { createApiApp } = require('./apiServer');

const isFunctionsEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

/**
 * Firebase CLI のバックエンド仕様解析フェーズでは admin.initializeApp() を
 * モジュールロード時に呼ばない（ADC のネットワーク探索でタイムアウトするのを防ぐ）。
 * 代わりに最初のリクエスト時に遅延初期化する。
 */
let _app = null;

function getApp() {
  if (!_app) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    _app = createApiApp();
  }
  return _app;
}

const apiOpts = {
  region: 'asia-northeast1',
  timeoutSeconds: 120,
  memory: '512MiB',
  invoker: 'public',
};
if (!isFunctionsEmulator) {
  /** 本番・検証: Secret Manager の値が process.env に注入される */
  apiOpts.secrets = [jwaXApiKeySecret, jwaApikeySecret];
}

exports.api = onRequest(apiOpts, (req, res) => getApp()(req, res));
