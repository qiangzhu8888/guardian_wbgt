/**
 * 1 セル LiPo 系を想定した電圧→推定残量（SOC 計測ではない参考値）
 */
export const BATTERY_VOLTAGE_FULL = 4.2;
export const BATTERY_VOLTAGE_EMPTY = 3.0;
export const BATTERY_VOLTAGE_WARN = 3.5;
export const BATTERY_VOLTAGE_OK = 3.85;

/** @typedef {'ok'|'warn'|'critical'} BatteryBand */

/**
 * @param {number|null|undefined} volts
 * @returns {{ percent: number, band: BatteryBand, label: string, volts: number } | null}
 */
export function estimateBatteryLevel(volts) {
  if (!Number.isFinite(volts) || volts <= 0) return null;

  const v = Number(volts);
  const span = BATTERY_VOLTAGE_FULL - BATTERY_VOLTAGE_EMPTY;
  const clamped = Math.max(BATTERY_VOLTAGE_EMPTY, Math.min(BATTERY_VOLTAGE_FULL, v));
  const percent = Math.round(((clamped - BATTERY_VOLTAGE_EMPTY) / span) * 100);

  /** @type {BatteryBand} */
  let band = 'ok';
  let label = '十分';
  if (v < BATTERY_VOLTAGE_WARN) {
    band = 'critical';
    label = '要確認';
  } else if (v < BATTERY_VOLTAGE_OK) {
    band = 'warn';
    label = '注意';
  }

  return { percent, band, label, volts: v };
}

/**
 * ゲートウェイ API の battery（0–100％）から表示用レベルを生成
 * @param {number|null|undefined} percent
 * @returns {{ percent: number, band: BatteryBand, label: string, volts: null } | null}
 */
export function batteryLevelFromPercent(percent) {
  if (!Number.isFinite(percent) || percent < 0) return null;
  const p = Math.round(Math.max(0, Math.min(100, Number(percent))));

  /** @type {BatteryBand} */
  let band = 'ok';
  let label = '十分';
  if (p < 25) {
    band = 'critical';
    label = '要確認';
  } else if (p < 50) {
    band = 'warn';
    label = '注意';
  }

  return { percent: p, band, label, volts: null };
}

/**
 * @param {{ voltage?: number|null, batteryPercent?: number|null }} input
 * @returns {{ percent: number, band: BatteryBand, label: string, volts: number|null } | null}
 */
export function resolveBatteryDisplayLevel(input) {
  if (input.batteryPercent != null && Number.isFinite(input.batteryPercent)) {
    return batteryLevelFromPercent(input.batteryPercent);
  }
  const fromVoltage = estimateBatteryLevel(input.voltage);
  if (!fromVoltage) return null;
  return { ...fromVoltage, volts: fromVoltage.volts };
}

/** @param {BatteryBand} band */
export function getBatteryBandStyles(band) {
  switch (band) {
    case 'critical':
      return {
        bar: 'bg-red-500',
        track: 'bg-red-100 dark:bg-red-950/50',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/60',
      };
    case 'warn':
      return {
        bar: 'bg-amber-500',
        track: 'bg-amber-100 dark:bg-amber-950/45',
        text: 'text-amber-800 dark:text-amber-200',
        badge: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/35 dark:text-amber-100 dark:border-amber-900/55',
      };
    default:
      return {
        bar: 'bg-emerald-500',
        track: 'bg-emerald-100 dark:bg-emerald-950/40',
        text: 'text-emerald-800 dark:text-emerald-200',
        badge: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-100 dark:border-emerald-900/55',
      };
  }
}
