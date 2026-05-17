'use strict';

const fs = require('fs');
const path = require('path');

describe('loadFunctionsDotEnv', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('どちらの .env も無いときは dotenv.config を呼ばない', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const dotenv = require('dotenv');
    const configSpy = jest.spyOn(dotenv, 'config').mockImplementation(() => ({}));
    const { loadFunctionsDotEnv } = require('../lib/loadLocalEnv');
    loadFunctionsDotEnv();
    expect(configSpy).not.toHaveBeenCalled();
  });

  it('functions/.env のみあるときは override true で1回だけ', () => {
    const dotenv = require('dotenv');
    const configSpy = jest.spyOn(dotenv, 'config').mockImplementation(() => ({}));
    const fe = path.join(__dirname, '..', '.env');
    const re = path.join(__dirname, '..', '..', '.env');
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => p === fe);
    const { loadFunctionsDotEnv } = require('../lib/loadLocalEnv');
    loadFunctionsDotEnv();
    expect(configSpy).toHaveBeenCalledTimes(1);
    expect(configSpy).toHaveBeenCalledWith({ path: fe, override: true });
  });

  it('functions/.env と リポジトリ直下 .env があるときは2回（2回目は override false）', () => {
    const dotenv = require('dotenv');
    const configSpy = jest.spyOn(dotenv, 'config').mockImplementation(() => ({}));
    const fe = path.join(__dirname, '..', '.env');
    const re = path.join(__dirname, '..', '..', '.env');
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => p === fe || p === re);
    const { loadFunctionsDotEnv } = require('../lib/loadLocalEnv');
    loadFunctionsDotEnv();
    expect(configSpy).toHaveBeenCalledTimes(2);
    expect(configSpy).toHaveBeenNthCalledWith(1, { path: fe, override: true });
    expect(configSpy).toHaveBeenNthCalledWith(2, { path: re, override: false });
  });

  it('functions/.env.local もあるときは3回目に override true', () => {
    const dotenv = require('dotenv');
    const configSpy = jest.spyOn(dotenv, 'config').mockImplementation(() => ({}));
    const fe = path.join(__dirname, '..', '.env');
    const re = path.join(__dirname, '..', '..', '.env');
    const fl = path.join(__dirname, '..', '.env.local');
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => p === fe || p === re || p === fl);
    const { loadFunctionsDotEnv } = require('../lib/loadLocalEnv');
    loadFunctionsDotEnv();
    expect(configSpy).toHaveBeenCalledTimes(3);
    expect(configSpy).toHaveBeenNthCalledWith(3, { path: fl, override: true });
  });

  it('functions/.env.local のみあるときは1回（override true）', () => {
    const dotenv = require('dotenv');
    const configSpy = jest.spyOn(dotenv, 'config').mockImplementation(() => ({}));
    const fl = path.join(__dirname, '..', '.env.local');
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => p === fl);
    const { loadFunctionsDotEnv } = require('../lib/loadLocalEnv');
    loadFunctionsDotEnv();
    expect(configSpy).toHaveBeenCalledTimes(1);
    expect(configSpy).toHaveBeenCalledWith({ path: fl, override: true });
  });
});
