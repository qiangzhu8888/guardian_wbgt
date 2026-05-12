'use strict';

const {
  isEmulatorRuntime,
  accessSecret,
  refreshSecret,
} = require('../lib/jwtEnv');

describe('jwtEnv', () => {
  let orig;

  beforeEach(() => {
    orig = {
      FUNCTIONS_EMULATOR: process.env.FUNCTIONS_EMULATOR,
      FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
    };
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(orig)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('isEmulatorRuntime is true when FUNCTIONS_EMULATOR is true', () => {
    delete process.env.FIRESTORE_EMULATOR_HOST;
    process.env.FUNCTIONS_EMULATOR = 'true';
    expect(isEmulatorRuntime()).toBe(true);
  });

  it('isEmulatorRuntime is true when FIRESTORE_EMULATOR_HOST is set', () => {
    delete process.env.FUNCTIONS_EMULATOR;
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    expect(isEmulatorRuntime()).toBe(true);
  });

  it('isEmulatorRuntime is false without emulator hints', () => {
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    expect(isEmulatorRuntime()).toBe(false);
  });

  it('accessSecret uses fallback when emulator host set and JWT unset', () => {
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_SECRET;
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    expect(accessSecret()).toBe('local-emulator-access-secret');
  });

  it('refreshSecret uses distinct fallback under emulator host', () => {
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_SECRET;
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    expect(refreshSecret()).toBe('local-emulator-refresh-secret');
  });

  it('accessSecret prefers JWT_SECRET over emulator fallback', () => {
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.JWT_SECRET = 'unified-dev-secret';
    expect(accessSecret()).toBe('unified-dev-secret');
    expect(refreshSecret()).toBe('unified-dev-secret');
  });
});
