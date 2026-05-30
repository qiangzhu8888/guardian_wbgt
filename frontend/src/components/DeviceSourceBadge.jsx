import { DEVICE_SOURCE_SHORT_LABEL } from '../lib/deviceIdSourceKind';

/**
 * @param {{ kind: 'demo' | 'live' | 'unknown', className?: string }} props
 */
export default function DeviceSourceBadge({ kind, className = '' }) {
  if (kind === 'unknown') return null;
  const isDemo = kind === 'demo';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-tight ${
        isDemo
          ? 'bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800'
          : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800'
      } ${className}`}
    >
      {DEVICE_SOURCE_SHORT_LABEL[kind]}
    </span>
  );
}
