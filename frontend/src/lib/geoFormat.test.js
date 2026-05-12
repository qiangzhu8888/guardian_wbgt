import { describe, it, expect } from 'vitest';
import { roundCoordForForm, parseDraftLatLng } from './geoFormat';

describe('roundCoordForForm', () => {
  it('rounds to 6 decimal places', () => {
    expect(roundCoordForForm(35.68123456789)).toBe('35.681235');
  });
  it('returns empty for non-finite', () => {
    expect(roundCoordForForm(NaN)).toBe('');
    expect(roundCoordForForm('')).toBe('');
  });
});

describe('parseDraftLatLng', () => {
  it('treats empty fields as no coordinates (not 0,0)', () => {
    expect(parseDraftLatLng('', '')).toBe(null);
    expect(parseDraftLatLng('35.68', '')).toBe(null);
    expect(parseDraftLatLng('', '139.76')).toBe(null);
  });
  it('parses valid pair', () => {
    expect(parseDraftLatLng('35.68', '139.76')).toEqual({ lat: 35.68, lng: 139.76 });
  });
  it('default Tokyo strings are a valid draft pair', () => {
    expect(parseDraftLatLng('35.6812', '139.7671')).toEqual({
      lat: 35.6812,
      lng: 139.7671,
    });
  });
});
