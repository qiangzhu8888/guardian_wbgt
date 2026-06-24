import { describe, expect, it } from 'vitest';
import {
  DEVICE_ID_DISPLAY_EXAMPLE,
  formatDeviceIdDisplay,
  formatDeviceIdForMessage,
  normalizeDeviceIdInput,
} from './deviceIdFormat';

describe('deviceIdFormat', () => {
  it('normalizes pasted or spaced input', () => {
    expect(normalizeDeviceIdInput('350 976-658.106130')).toBe('350976658106130');
    expect(normalizeDeviceIdInput('abc')).toBe('');
  });

  it('formats 15-digit IMEI in groups of three', () => {
    expect(formatDeviceIdDisplay('350976658106130')).toBe(DEVICE_ID_DISPLAY_EXAMPLE);
  });

  it('formats shorter ids with trailing group', () => {
    expect(formatDeviceIdDisplay('123456')).toBe('123 456');
    expect(formatDeviceIdDisplay('1234567')).toBe('123 4567');
  });

  it('message helper falls back to trimmed raw', () => {
    expect(formatDeviceIdForMessage('350976658106130')).toBe(DEVICE_ID_DISPLAY_EXAMPLE);
    expect(formatDeviceIdForMessage('')).toBe('');
  });
});
