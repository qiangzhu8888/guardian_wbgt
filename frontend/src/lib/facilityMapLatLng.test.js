import { describe, expect, it } from 'vitest';
import { formatLatLngInput, parseOptionalLatLng } from './facilityMapLatLng';

describe('facilityMapLatLng', () => {
  it('parseOptionalLatLng は有効な数値ペアのみ', () => {
    expect(parseOptionalLatLng('35.68', '139.76')).toEqual({ lat: 35.68, lng: 139.76 });
    expect(parseOptionalLatLng('', '')).toBeNull();
    expect(parseOptionalLatLng('35', '')).toBeNull();
    expect(parseOptionalLatLng('200', '139')).toBeNull();
  });

  it('formatLatLngInput', () => {
    expect(formatLatLngInput(35.681234567, 139.7671)).toEqual({ lat: '35.681235', lng: '139.767100' });
  });
});
