import { formatDeviceIdDisplay, normalizeDeviceIdInput } from '../lib/deviceIdFormat';

/**
 * デバイス ID の読みやすい表示（ホバーで数字のみ）
 * @param {{ deviceId?: string | null, className?: string, emptyLabel?: string }} props
 */
export default function DeviceIdText({ deviceId, className = '', emptyLabel = '—' }) {
  const raw = normalizeDeviceIdInput(deviceId);
  if (!raw) {
    return <span className={className}>{emptyLabel}</span>;
  }
  const display = formatDeviceIdDisplay(raw);
  return (
    <span
      className={`font-mono tabular-nums tracking-tight ${className}`.trim()}
      title={raw}
    >
      {display}
    </span>
  );
}
