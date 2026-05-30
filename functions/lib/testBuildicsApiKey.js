'use strict';

const BUILDICS_API_BASE = 'https://www.buildics.jp/api';
const TEST_WINDOW_MS = 60 * 60 * 1000;

/**
 * BUILDICS API キーの疎通確認（軽量エンドポイント）
 * @param {string} apiKey
 * @returns {Promise<{
 *   ok: boolean,
 *   status: 'ok' | 'no_key' | 'auth_error' | 'api_error' | 'http_error' | 'network_error',
 *   message: string,
 *   upstreamCode?: number,
 *   httpStatus?: number,
 * }>}
 */
async function testBuildicsApiKey(apiKey) {
  const key = String(apiKey || '').trim();
  if (!key) {
    return {
      ok: false,
      status: 'no_key',
      message: 'API キーが未設定です。キーを入力するか、組織に保存済みのキーを利用してください。',
    };
  }

  const now = Date.now();
  const body = { startTime: now - TEST_WINDOW_MS, endTime: now };

  try {
    const upstream = await fetch(`${BUILDICS_API_BASE}/common/apgateway/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Apikey: key,
        'X-Apikey-Encoding': 'base64',
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      return {
        ok: false,
        status: 'http_error',
        httpStatus: upstream.status,
        message: `BUILDICS から HTTP ${upstream.status} が返りました。キーとネットワークを確認してください。`,
      };
    }

    const json = await upstream.json();
    const code = json.code ?? json.Code;
    if (code === 200) {
      return {
        ok: true,
        status: 'ok',
        upstreamCode: code,
        message: 'BUILDICS API への接続に成功しました。',
      };
    }

    const upstreamMsg = String(json.msg ?? json.Msg ?? json.message ?? '').trim();
    if (code === 401 || code === 403) {
      return {
        ok: false,
        status: 'auth_error',
        upstreamCode: code,
        message: upstreamMsg || 'API キーが無効、または権限がありません。',
      };
    }

    return {
      ok: false,
      status: 'api_error',
      upstreamCode: code,
      message: upstreamMsg || `BUILDICS API がエラーを返しました（code: ${code}）。`,
    };
  } catch {
    return {
      ok: false,
      status: 'network_error',
      message: 'BUILDICS への接続に失敗しました。ネットワークとファイアウォールを確認してください。',
    };
  }
}

module.exports = { testBuildicsApiKey, BUILDICS_API_BASE, TEST_WINDOW_MS };
