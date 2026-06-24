import { formatVoltageVolts } from '../lib/wbgt';
import { resolveBatteryDisplayLevel, getBatteryBandStyles } from '../lib/batteryLevel';

/**
 * @param {{
 *   voltage?: number|null,
 *   batteryPercent?: number|null,
 *   compact?: boolean,
 *   className?: string,
 *   dimmed?: boolean,
 *   cached?: boolean,
 *   source?: 'gateway'|'heartbeat'|null,
 * }} props
 */
export default function BatteryLevelIndicator({
  voltage,
  batteryPercent = null,
  compact = false,
  className = '',
  dimmed = false,
  cached = false,
  source = null,
}) {
  const level = resolveBatteryDisplayLevel({ voltage, batteryPercent });
  if (!level) return null;

  const fromGateway = source === 'gateway' || (batteryPercent != null && source !== 'heartbeat');
  const styles = getBatteryBandStyles(level.band);
  const vLabel = level.volts != null ? formatVoltageVolts(level.volts) : '';
  const percentPrefix = fromGateway && !cached ? '' : '約';
  const hint = cached
    ? '前回取得した電池残量'
    : fromGateway
      ? 'BUILDICS ゲートウェイ API の battery（参考）'
      : '電圧からの推定残量（参考）。厳密な SOC ではありません。';
  const ariaLabel = `電源${fromGateway ? '' : '推定'}残量 ${percentPrefix}${level.percent}パーセント${vLabel ? ` ${vLabel}ボルト` : ''} ${level.label}${cached ? ' 前回値' : ''}`;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${styles.badge} ${dimmed || cached ? 'opacity-70' : ''} ${className}`}
        title={hint}
        aria-label={ariaLabel}
      >
        <span aria-hidden="true">🔋</span>
        <span>
          {percentPrefix}
          {level.percent}%
        </span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 px-2.5 py-2 ${dimmed || cached ? 'opacity-55' : ''} ${className}`}
      title={hint}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className={`text-[10px] font-semibold ${styles.text}`}>
          <span aria-hidden="true">🔋 </span>
          電源{fromGateway ? '' : '（推定）'}
          {cached ? '・前回値' : ''}
        </p>
        <p className={`text-[10px] font-medium tabular-nums ${styles.text}`}>
          {vLabel ? `${vLabel} V　` : ''}
          {percentPrefix}
          {level.percent}%（{level.label}）
        </p>
      </div>
      <div
        className={`h-2 w-full overflow-hidden rounded-full ${styles.track}`}
        role="progressbar"
        aria-valuenow={level.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${styles.bar}`}
          style={{ width: `${level.percent}%` }}
        />
      </div>
    </div>
  );
}
