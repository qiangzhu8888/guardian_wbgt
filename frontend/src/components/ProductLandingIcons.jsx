/** 製品案内向けの装飾 SVG（currentColor でテーマに追従） */

function BaseIcon({ className = 'h-6 w-6', children, title }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconThermometer({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </BaseIcon>
  );
}

export function IconLayoutGrid({ className }) {
  return (
    <BaseIcon className={className}>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </BaseIcon>
  );
}

export function IconSmartphone({ className }) {
  return (
    <BaseIcon className={className}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </BaseIcon>
  );
}

export function IconCloud({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </BaseIcon>
  );
}

export function IconLink({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </BaseIcon>
  );
}

export function IconClipboardList({ className }) {
  return (
    <BaseIcon className={className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </BaseIcon>
  );
}

export function IconShieldCheck({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </BaseIcon>
  );
}

export function IconSchool({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m4 6 8-4 8 4-8 4-8-4Z" />
      <path d="m6 11 4 2" />
      <path d="M6 11v5c0 1 2 2 6 2s6-1 6-2v-5" />
      <path d="M18 11v5" />
    </BaseIcon>
  );
}

export function IconLandmark({ className }) {
  return (
    <BaseIcon className={className}>
      <line x1="3" x2="21" y1="22" y2="22" />
      <line x1="6" x2="6" y1="18" y2="11" />
      <line x1="10" x2="10" y1="18" y2="11" />
      <line x1="14" x2="14" y1="18" y2="11" />
      <line x1="18" x2="18" y1="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </BaseIcon>
  );
}

export function IconFactory({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-4.5 3L6 8v12Z" />
      <path d="M18 12v8" />
      <path d="M14 16v4" />
      <path d="M10 14v6" />
    </BaseIcon>
  );
}

export function IconCalendarFold({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
    </BaseIcon>
  );
}

export function IconCpu({ className }) {
  return (
    <BaseIcon className={className}>
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" />
      <path d="M15 20v2" />
      <path d="M2 15h2" />
      <path d="M2 9h2" />
      <path d="M20 15h2" />
      <path d="M20 9h2" />
      <path d="M9 2v2" />
      <path d="M9 20v2" />
    </BaseIcon>
  );
}

export function IconLayers({ className }) {
  return (
    <BaseIcon className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </BaseIcon>
  );
}

export function IconMonitor({ className }) {
  return (
    <BaseIcon className={className}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </BaseIcon>
  );
}

export function IconArrowUp({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </BaseIcon>
  );
}

export function IconArrowDown({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </BaseIcon>
  );
}

export function IconSparkles({ className }) {
  return (
    <BaseIcon className={className}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </BaseIcon>
  );
}

/** アイコンをグラデーションリング付きの丸で包む */
export function FeatureIconWrap({ tone = 'sky', children }) {
  const tones = {
    sky: 'from-sky-400/90 to-sky-600 text-white shadow-lg shadow-sky-500/25',
    emerald: 'from-emerald-400/90 to-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    violet: 'from-violet-400/90 to-violet-600 text-white shadow-lg shadow-violet-500/25',
    amber: 'from-amber-400/90 to-amber-600 text-white shadow-lg shadow-amber-500/25',
    rose: 'from-rose-400/90 to-rose-600 text-white shadow-lg shadow-rose-500/25',
    slate: 'from-slate-500/90 to-slate-700 text-white shadow-lg shadow-slate-900/20',
  };
  return (
    <div
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone] ?? tones.sky}`}
    >
      <span className="[&>svg]:h-6 [&>svg]:w-6">{children}</span>
    </div>
  );
}
