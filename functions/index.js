'use strict';

const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { createApiApp } = require('./apiServer');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.api = onRequest(
  {
    region: 'asia-northeast1',
    timeoutSeconds: 120,
    memory: '512MiB',
    invoker: 'public',
  },
  createApiApp(),
);
