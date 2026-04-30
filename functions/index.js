/**
 * BUILDICS API プロキシ関数
 * APIキーは functions/.env の BUILDICS_API_KEY から取得
 */

const { onRequest } = require('firebase-functions/v2/https');

const BUILDICS_API_BASE = 'https://www.buildics.jp/api';

const ALLOWED_PATHS = new Set([
  '/common/device/queryDeviceData',
  '/common/apgateway/status',
]);

exports.buildicsProxy = onRequest(
  {
    region: 'asia-northeast1',
    cors: true,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ code: 405, msg: 'Method Not Allowed' });
      return;
    }

    const upstreamPath = req.query.path;
    if (!upstreamPath || !ALLOWED_PATHS.has(upstreamPath)) {
      res.status(400).json({ code: 400, msg: '許可されていないエンドポイントです' });
      return;
    }

    try {
      const apiKey = process.env.BUILDICS_API_KEY;
      const upstream = await fetch(`${BUILDICS_API_BASE}${upstreamPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Apikey': apiKey,
          'X-Apikey-Encoding': 'base64',
        },
        body: JSON.stringify(req.body),
      });

      if (!upstream.ok) {
        res.status(upstream.status).json({ code: upstream.status, msg: upstream.statusText });
        return;
      }

      const data = await upstream.json();
      res.json(data);
    } catch (err) {
      console.error('BUILDICS proxy error:', err);
      res.status(500).json({ code: 500, msg: '上流APIへの接続に失敗しました' });
    }
  },
);
