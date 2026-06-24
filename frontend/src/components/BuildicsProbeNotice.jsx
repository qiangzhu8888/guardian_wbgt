import { describeBuildicsProbeUi, buildicsProbeBadgeClass } from '../lib/buildicsDeviceProbeUi';

/**
 * @param {{ deviceId?: string, probing?: boolean, probe?: { deviceId?: string, buildicsStatus?: string } | null, className?: string }} props
 */
export default function BuildicsProbeNotice({ deviceId, probing = false, probe = null, className = '' }) {
  const ui = describeBuildicsProbeUi({ deviceId, probing, probe });
  if (ui.status === 'idle') return null;

  const badgeClass = buildicsProbeBadgeClass(ui.status);
  return (
    <div className={`mt-2 flex flex-col gap-1 ${className}`.trim()} role="status" aria-live="polite">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-tight ${badgeClass}`}
        >
          {ui.status === 'loading' ? (
            <>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80 animate-pulse mr-1"
                aria-hidden
              />
              {ui.title}
            </>
          ) : (
            ui.title
          )}
        </span>
      </div>
      {ui.message ? (
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{ui.message}</p>
      ) : null}
    </div>
  );
}
