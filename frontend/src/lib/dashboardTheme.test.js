import { describe, it, expect } from 'vitest';
import { pickerHexFromTheme, normalizeDashboardHex } from './dashboardTheme';

describe('dashboardTheme', () => {
  it('pickerHexFromTheme uses theme when valid', () => {
    expect(pickerHexFromTheme('#aabbcc')).toBe('#AABBCC');
    expect(pickerHexFromTheme('')).toBe('#0EA5E9');
  });

  it('normalizeDashboardHex', () => {
    expect(normalizeDashboardHex('#00ff00')).toBe('#00FF00');
    expect(normalizeDashboardHex('')).toBe('');
    expect(normalizeDashboardHex('red')).toBe('');
  });
});
