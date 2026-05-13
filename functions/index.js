'use strict';

const { loadFunctionsDotEnv } = require('./lib/loadLocalEnv');
loadFunctionsDotEnv();

const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { createApiApp } = require('./apiServer');

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

exports.api = onRequest(
  {
    region: 'asia-northeast1',
    timeoutSeconds: 120,
    memory: '512MiB',
    invoker: 'public',
  },
  (req, res) => getApp()(req, res),
);
