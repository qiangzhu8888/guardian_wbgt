'use strict';

const {
  runBootstrapFirstAdmin,
  normalizeBootstrapBaseUrl,
  probePublicApiReachable,
} = require('../scripts/bootstrap-first-admin.cjs');

describe('normalizeBootstrapBaseUrl', () => {
  test('Hosting の誤った末尾 /api を除去', () => {
    expect(normalizeBootstrapBaseUrl('https://ex.web.app/api')).toBe('https://ex.web.app');
    expect(normalizeBootstrapBaseUrl('https://ex.web.app/api/')).toBe('https://ex.web.app');
  });

  test('Functions エミュポートのみならプロジェクトパスを補完', () => {
    expect(normalizeBootstrapBaseUrl('http://127.0.0.1:65001')).toBe(
      'http://127.0.0.1:65001/wbgt-monitor-d5556/asia-northeast1/api',
    );
  });

  test('Hosting エミュポートは書き換えない', () => {
    expect(normalizeBootstrapBaseUrl('http://127.0.0.1:5000')).toBe('http://127.0.0.1:5000');
  });
});

describe('probePublicApiReachable', () => {
  test('JSON 応答なら到達可能', async () => {
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      text: async () => '{"defaultOrgSlug":"default"}',
    });
    const r = await probePublicApiReachable('https://ex.web.app', fetchImpl);
    expect(r.ok).toBe(true);
    expect(r.url).toBe('https://ex.web.app/api/public/config');
  });

  test('Google 系 HTML 404 なら未到達', async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 404,
      text: async () =>
        '<html><head><title>404 Page not found</title></head><body>Error</body></html>',
    });
    const r = await probePublicApiReachable('https://ex.web.app', fetchImpl);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('html_404');
  });

  test('JSON のエラー応答でも API は生きている', async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 404,
      text: async () => '{"code":404,"msg":"設定が見つかりません"}',
    });
    const r = await probePublicApiReachable('https://ex.web.app', fetchImpl);
    expect(r.ok).toBe(true);
  });
});

describe('runBootstrapFirstAdmin', () => {
  test('初回のみ bootstrap が成功すれば superadmin は呼ばない', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ code: 200, userId: 'u1', email: 'a@b.co', role: 'superadmin' }),
      };
    };

    const r = await runBootstrapFirstAdmin({
      base: 'https://ex.web.app',
      secret: 'sec',
      email: 'a@b.co',
      password: 'password12',
      fetchImpl,
    });

    expect(r.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://ex.web.app/api/auth/bootstrap');
  });

  test('409 のあと bootstrap-superadmin で新規作成できる', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url, init });
      if (calls.length === 1) {
        return {
          ok: false,
          status: 409,
          text: async () => JSON.stringify({ code: 409, msg: 'ユーザーが既に存在します' }),
        };
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({ code: 200, userId: 'u2', email: 'super@x.jp', action: 'created' }),
      };
    };

    const r = await runBootstrapFirstAdmin({
      base: 'https://ex.web.app',
      secret: 'sec',
      email: 'super@x.jp',
      password: 'password12',
      fetchImpl,
    });

    expect(r.ok).toBe(true);
    expect(r.log).toContain('created');
    expect(calls).toHaveLength(2);
    expect(calls[1].url).toBe('https://ex.web.app/api/auth/bootstrap-superadmin');
    expect(JSON.parse(calls[1].init.body).email).toBe('super@x.jp');
  });
});
