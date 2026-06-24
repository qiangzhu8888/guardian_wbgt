'use strict';

const { isUsableLatLng, parseUsableLatLonQuery, latLonRejectMessage } = require('../lib/geoLatLng');

describe('geoLatLng', () => {
  test('isUsableLatLng rejects 0,0', () => {
    expect(isUsableLatLng(0, 0)).toBe(false);
    expect(isUsableLatLng(35.68, 139.76)).toBe(true);
  });

  test('parseUsableLatLonQuery rejects invalid points', () => {
    expect(parseUsableLatLonQuery({ lat: 0, lon: 0 })).toBeNull();
    expect(parseUsableLatLonQuery({ lat: 35, lng: 139 })).toEqual({ lat: 35, lng: 139 });
  });

  test('latLonRejectMessage explains 0,0', () => {
    expect(latLonRejectMessage({ lat: 0, lon: 0 })).toContain('0,0');
  });
});
