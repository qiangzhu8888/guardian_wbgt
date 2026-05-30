'use strict';

const { testBuildicsApiKey } = require('../lib/testBuildicsApiKey');

describe('testBuildicsApiKey', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns no_key when empty', async () => {
    const r = await testBuildicsApiKey('');
    expect(r.ok).toBe(false);
    expect(r.status).toBe('no_key');
  });

  it('returns ok when BUILDICS responds 200', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, data: [] }),
      }),
    );
    const r = await testBuildicsApiKey('my-api-key');
    expect(r.ok).toBe(true);
    expect(r.status).toBe('ok');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/common/apgateway/status'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Apikey: 'my-api-key' }),
      }),
    );
  });

  it('returns auth_error on 401 upstream code', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ code: 401, msg: 'Unauthorized' }),
      }),
    );
    const r = await testBuildicsApiKey('bad-key');
    expect(r.ok).toBe(false);
    expect(r.status).toBe('auth_error');
  });

  it('returns network_error when fetch throws', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network')));
    const r = await testBuildicsApiKey('key');
    expect(r.ok).toBe(false);
    expect(r.status).toBe('network_error');
  });
});
