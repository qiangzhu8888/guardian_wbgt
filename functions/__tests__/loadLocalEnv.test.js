'use strict';

const fs = require('fs');

describe('loadFunctionsDotEnv', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('functions/.env が無い経路では dotenv.config を呼ばない', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const dotenv = require('dotenv');
    const configSpy = jest.spyOn(dotenv, 'config').mockImplementation(() => ({}));
    const { loadFunctionsDotEnv } = require('../lib/loadLocalEnv');
    loadFunctionsDotEnv();
    expect(configSpy).not.toHaveBeenCalled();
  });
});
