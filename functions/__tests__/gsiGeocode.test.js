'use strict';

const { parseGsiAddressSearchResults } = require('../lib/gsiGeocode');

describe('gsiGeocode', () => {
  it('parseGsiAddressSearchResults reads lng,lat from GeoJSON', () => {
    const r = parseGsiAddressSearchResults([
      {
        geometry: { coordinates: [139.751663, 35.658054], type: 'Point' },
        type: 'Feature',
        properties: { title: '東京都港区' },
      },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lng).toBeCloseTo(139.751663, 5);
      expect(r.lat).toBeCloseTo(35.658054, 5);
      expect(r.label).toBe('東京都港区');
    }
  });

  it('parseGsiAddressSearchResults rejects empty', () => {
    expect(parseGsiAddressSearchResults([]).ok).toBe(false);
    expect(parseGsiAddressSearchResults(null).ok).toBe(false);
  });
});
