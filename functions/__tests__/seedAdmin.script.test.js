'use strict';

const {
  rewriteLocalEmuFunctionsTriplePath,
  expandEmulatorHostPortOnlyBase,
  emulatorBaseUrl,
} = require('../scripts/seed-admin.cjs');

describe('seed-admin URL helpers', () => {
  const prev = process.env.FUNCTIONS_EMULATOR_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.FUNCTIONS_EMULATOR_URL;
    else process.env.FUNCTIONS_EMULATOR_URL = prev;
  });

  test('誤 typo wgbt-monitor を wbgt-monitor-d5556 に補正', () => {
    const raw = 'http://127.0.0.1:65001/wgbt-monitor/asia-northeast1/api';
    expect(rewriteLocalEmuFunctionsTriplePath(raw)).toBe(
      'http://127.0.0.1:65001/wbgt-monitor-d5556/asia-northeast1/api',
    );
  });

  test('ポートのみ指定時にプロジェクトパスを補完', () => {
    expect(expandEmulatorHostPortOnlyBase('http://127.0.0.1:65001')).toBe(
      'http://127.0.0.1:65001/wbgt-monitor-d5556/asia-northeast1/api',
    );
  });

  test('FUNCTIONS_EMULATOR_URL 未設定時の既定ベース', () => {
    delete process.env.FUNCTIONS_EMULATOR_URL;
    expect(emulatorBaseUrl()).toBe('http://127.0.0.1:65001/wbgt-monitor-d5556/asia-northeast1/api');
  });
});
