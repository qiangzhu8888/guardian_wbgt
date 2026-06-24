/**
 * ダッシュボード／詳細の気温・湿度（またはデモ天気）1行表示
 * @param {{ isMock?: boolean, weatherIcon?: string, weather?: string, temp?: number | null, humidity?: number | null }} facility
 * @returns {string}
 */
export function formatFacilityAmbientLine(facility) {
  if (facility?.isMock) {
    const icon = facility.weatherIcon || '';
    const weather = facility.weather || '—';
    const temp = facility.temp != null ? `${facility.temp}℃` : '—';
    const hum = facility.humidity != null ? `${facility.humidity}%` : '—';
    return `${icon} ${weather}　${temp}　湿度 ${hum}`.trim();
  }

  const temp =
    facility?.temp != null && Number.isFinite(Number(facility.temp)) ? `${facility.temp}℃` : '—';
  const hum =
    facility?.humidity != null && Number.isFinite(Number(facility.humidity))
      ? `${facility.humidity}%`
      : '—';
  return `🌡 気温 ${temp}　湿度 ${hum}`;
}
