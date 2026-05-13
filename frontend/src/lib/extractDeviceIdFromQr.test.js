import { describe, it, expect } from 'vitest';
import { extractDeviceIdFromQrText } from './extractDeviceIdFromQr';

describe('extractDeviceIdFromQrText', () => {
  it('そのまま有効な数字列を受け入れる', () => {
    expect(extractDeviceIdFromQrText('350976658106130')).toEqual({
      ok: true,
      deviceId: '350976658106130',
    });
  });

  it('JSON の deviceId を解釈する', () => {
    expect(extractDeviceIdFromQrText('{"deviceId":"350976658106130"}')).toEqual({
      ok: true,
      deviceId: '350976658106130',
    });
  });

  it('URL のクエリ deviceId を解釈する', () => {
    expect(extractDeviceIdFromQrText('https://x.example/?deviceId=350976658106130')).toEqual({
      ok: true,
      deviceId: '350976658106130',
    });
  });

  it('本文中の単一の数字列を抽出する', () => {
    expect(extractDeviceIdFromQrText('ID:350976658106130')).toEqual({
      ok: true,
      deviceId: '350976658106130',
    });
  });

  it('短すぎる数字は拒否する', () => {
    expect(extractDeviceIdFromQrText('12345').ok).toBe(false);
  });

  it('複数候補では拒否する', () => {
    expect(extractDeviceIdFromQrText('350976658106130 350976658106131').ok).toBe(false);
  });
});
