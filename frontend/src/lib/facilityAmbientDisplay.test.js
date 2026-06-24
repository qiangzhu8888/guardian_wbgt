import { describe, expect, it } from 'vitest';
import { formatFacilityAmbientLine } from './facilityAmbientDisplay';

describe('formatFacilityAmbientLine', () => {
  it('shows demo weather line for mock facilities', () => {
    expect(
      formatFacilityAmbientLine({
        isMock: true,
        weatherIcon: '☀️',
        weather: '晴れ',
        temp: 33,
        humidity: 70,
      }),
    ).toBe('☀️ 晴れ　33℃　湿度 70%');
  });

  it('shows sensor temp/humidity for live facilities without weather placeholder', () => {
    expect(
      formatFacilityAmbientLine({
        isMock: false,
        weatherIcon: '📍',
        weather: '—',
        temp: 24.93,
        humidity: 55,
      }),
    ).toBe('🌡 気温 24.93℃　湿度 55%');
  });

  it('uses em dash when live sensor values are missing', () => {
    expect(
      formatFacilityAmbientLine({
        isMock: false,
        temp: null,
        humidity: null,
      }),
    ).toBe('🌡 気温 —　湿度 —');
  });
});
