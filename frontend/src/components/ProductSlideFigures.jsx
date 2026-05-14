/**
 * 製品スライド用のイラスト SVG（ベクター・本文と独立して差し替え可能）
 */

const svgBase = 'block w-full h-auto max-h-[140px] sm:max-h-[160px]';

function wrapClass(theme) {
  if (theme === 'hero' || theme === 'dark') {
    return 'rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 sm:px-5 sm:py-4 shadow-inner';
  }
  return 'rounded-2xl border border-slate-200/90 bg-slate-50/90 px-4 py-3 sm:px-5 sm:py-4 shadow-sm dark:border-slate-600/70 dark:bg-slate-800/50';
}

/** すべてのスライド id に一致することをテストで確認する */
export const PRODUCT_SLIDE_FIGURE_IDS = [
  'intro',
  'wbgt',
  'hook',
  'levels',
  'problem',
  'solution',
  'data',
  'ops',
  'ledger',
  'mobile',
  'usecases',
  'trust',
  'cta',
];

function FigIntro() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400/90">
        <path d="M24 88V52l22-12 22 12v36" className="text-sky-300/80" />
        <path d="M68 88V56l18-10 18 10v32" />
        <path d="M112 88V48l26-14 26 14v40" />
        <path d="M164 88V58l20-11 20 11v30" />
        <circle cx="232" cy="44" r="14" />
        <path d="M232 34v20M224 42h16" />
        <path d="M232 62v8" className="text-amber-400/80" strokeWidth="1.5" />
      </g>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-emerald-400/70">
        <path d="M8 92h264" opacity="0.5" />
        <path d="M16 92c8-4 20-4 28 0M44 92c8-4 20-4 28 0" />
      </g>
    </svg>
  );
}

function FigWbgt() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400/95">
        <circle cx="52" cy="44" r="22" />
        <path d="M52 30v8M66 44h-8M62 32l-6 6" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-400/85">
        <path d="M102 68c6-20 20-32 36-32s30 12 36 32" />
        <path d="M98 72h80" />
      </g>
      <g className="text-sky-500/80" fill="currentColor">
        <path d="M184 38c0-6 4-10 10-10s10 4 10 10c0 8-10 18-10 18s-10-10-10-18Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-rose-400/90">
        <path d="M226 82V52" />
        <path d="M226 46c8 0 14 6 14 14v22h-28V60c0-8 6-14 14-14Z" />
        <path d="M218 78h16" />
      </g>
      <path d="M118 92h100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="text-slate-400/60 dark:text-slate-500" opacity="0.8" />
    </svg>
  );
}

function FigHookFixed() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <rect x="20" y="20" width="72" height="88" rx="10" fill="none" className="text-sky-500/55 dark:text-sky-400/45" />
        <rect x="104" y="20" width="72" height="88" rx="10" fill="none" className="text-sky-500/55 dark:text-sky-400/45" />
        <rect x="188" y="20" width="72" height="88" rx="10" fill="none" className="text-sky-500/55 dark:text-sky-400/45" />
      </g>
      <rect x="32" y="36" width="48" height="8" rx="2" className="fill-red-500/75" />
      <rect x="116" y="36" width="48" height="8" rx="2" className="fill-amber-500/75" />
      <rect x="200" y="36" width="48" height="8" rx="2" className="fill-emerald-500/70" />
      <rect x="32" y="52" width="40" height="5" rx="1" className="fill-slate-400/45 dark:fill-slate-500/55" />
      <rect x="116" y="52" width="40" height="5" rx="1" className="fill-slate-400/45 dark:fill-slate-500/55" />
      <rect x="200" y="52" width="40" height="5" rx="1" className="fill-slate-400/45 dark:fill-slate-500/55" />
      <circle cx="56" cy="82" r="5" className="fill-sky-500/60" />
      <circle cx="140" cy="82" r="5" className="fill-sky-500/60" />
      <circle cx="224" cy="82" r="5" className="fill-sky-500/60" />
    </svg>
  );
}

function FigLevels() {
  return (
    <svg viewBox="0 0 280 100" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="12" y="28" width="40" height="44" rx="4" className="fill-red-500/85" />
      <rect x="56" y="28" width="40" height="44" rx="4" className="fill-orange-500/85" />
      <rect x="100" y="28" width="40" height="44" rx="4" className="fill-yellow-500/85" />
      <rect x="144" y="28" width="40" height="44" rx="4" className="fill-blue-500/80" />
      <rect x="188" y="28" width="40" height="44" rx="4" className="fill-emerald-500/80" />
      <rect x="232" y="28" width="36" height="44" rx="4" className="fill-slate-500/70 stroke-slate-400 dark:fill-slate-600/80" strokeWidth="1" />
      <text x="32" y="22" textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-[7px] font-sans">危険</text>
      <text x="232" y="22" textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-[6px] font-sans">
        通信
      </text>
    </svg>
  );
}

function FigProblemFixed() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M48 44h64c6 0 10 4 10 10v20c0 6-4 10-10 10H58l-10 10V74c-6 0-10-4-10-10V54c0-6 4-10 10-10Z"
        fill="rgba(255,255,255,0.06)"
        stroke="currentColor"
        strokeWidth="2"
        className="text-slate-400"
      />
      <path
        d="M168 36h64c6 0 10 4 10 10v24c0 6-4 10-10 10h-54l-10 10V80c-6 0-10-4-10-10V46c0-6 4-10 10-10Z"
        fill="rgba(255,255,255,0.06)"
        stroke="currentColor"
        strokeWidth="2"
        className="text-slate-400"
      />
      <text x="88" y="72" textAnchor="middle" className="fill-amber-400 font-bold" style={{ fontSize: '18px' }}>
        ?
      </text>
      <text x="208" y="72" textAnchor="middle" className="fill-amber-400 font-bold" style={{ fontSize: '18px' }}>
        ?
      </text>
      <path
        d="M118 64l24-8M130 72l20 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-rose-400/85"
        strokeDasharray="5 4"
      />
    </svg>
  );
}

function FigSolution() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="24" y="24" width="104" height="72" rx="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-500/60 dark:text-sky-400/50" />
      <rect x="40" y="40" width="24" height="16" rx="3" className="fill-sky-400/35" />
      <rect x="72" y="40" width="24" height="16" rx="3" className="fill-sky-400/35" />
      <rect x="40" y="64" width="24" height="16" rx="3" className="fill-sky-400/35" />
      <rect x="72" y="64" width="24" height="16" rx="3" className="fill-sky-400/35" />
      <path d="M152 60h28M168 52v16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-sky-500" />
      <rect x="196" y="32" width="72" height="64" rx="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-500/75 dark:text-sky-400/65" />
      <rect x="208" y="44" width="48" height="10" rx="2" className="fill-red-500/65" />
      <rect x="208" y="60" width="40" height="6" rx="1" className="fill-slate-400/45 dark:fill-slate-500/55" />
      <rect x="208" y="72" width="44" height="6" rx="1" className="fill-slate-400/45 dark:fill-slate-500/55" />
      <circle cx="232" cy="96" r="5" className="fill-sky-500/55" />
    </svg>
  );
}

function FigData() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-500/80 dark:text-emerald-400/70">
        <path d="M36 88V56l12-8 12 8v32" />
        <circle cx="48" cy="44" r="6" />
        <path d="M42 38h12M48 32v12" />
      </g>
      <path d="M76 68h48" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4" className="text-slate-400/70" />
      <path
        d="M152 44c0-12 10-22 22-22h20c12 0 22 10 22 22v24c0 12-10 22-22 22h-20c-12 0-22-10-22-22Z"
        className="fill-sky-400/25 stroke-sky-500/70 dark:fill-sky-500/20 dark:stroke-sky-400/55"
        strokeWidth="2"
      />
      <path d="M168 56h48M168 68h36M168 80h42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-600/50 dark:text-sky-300/45" />
      <path d="M214 68h40" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4" className="text-slate-400/70" />
      <rect x="236" y="48" width="40" height="32" rx="4" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-500/70" />
      <rect x="242" y="56" width="28" height="4" rx="1" className="fill-sky-400/50" />
      <rect x="242" y="64" width="20" height="3" rx="1" className="fill-slate-400/40" />
    </svg>
  );
}

function FigOps() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="140" cy="36" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-500/70" />
      <path d="M128 36h24M140 28v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-500/70" />
      <path d="M52 92 L92 72 L132 88 L172 68 L228 92" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400/65 dark:text-slate-500/60" />
      {[52, 92, 132, 172, 228].map((cx, i) => (
        <g key={i} transform={`translate(${cx - 8}, 84)`}>
          <path d="M8 16c0-6 4-10 8-10s8 4 8 10v6H0v-6Z" fill="currentColor" className="text-sky-400/55" />
          <circle cx="8" cy="10" r="4" fill="currentColor" className="text-sky-500/65" />
        </g>
      ))}
    </svg>
  );
}

function FigLedger() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="64" y="20" width="152" height="88" rx="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-600/55 dark:text-sky-400/50" />
      <rect x="96" y="12" width="88" height="14" rx="4" fill="currentColor" className="text-sky-500/40 dark:text-sky-500/35" />
      <path d="M76 44h48M76 56h80M76 68h72M76 80h64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500/55 dark:text-slate-400/55" />
      <path d="M76 44l8 8M84 44l-8 8" stroke="currentColor" strokeWidth="2" className="text-emerald-500/80" />
      <path d="M76 56l8 8M84 56l-8 8" stroke="currentColor" strokeWidth="2" className="text-emerald-500/80" />
      <circle cx="232" cy="72" r="22" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-500/50" />
      <path d="M232 62v12l8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-500/60" />
    </svg>
  );
}

function FigMobile() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="108" y="16" width="64" height="96" rx="10" fill="none" stroke="currentColor" strokeWidth="3" className="text-sky-400/75" />
      <rect x="116" y="28" width="48" height="64" rx="4" className="fill-sky-500/15 stroke-sky-500/40 dark:fill-sky-400/10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="140" cy="100" r="3" className="fill-slate-400/70" />
      <circle cx="52" cy="40" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/90" />
      <path d="M52 30v8M46 40h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400/90" />
      <path
        d="M220 36c8 4 14 14 14 24a22 22 0 1 1-14-24Z"
        className="fill-indigo-300/40 stroke-indigo-400/70 dark:fill-indigo-400/35"
        strokeWidth="1.5"
      />
      <path d="M212 56c4 6 10 10 18 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-300/60" fill="none" />
    </svg>
  );
}

function FigUsecasesFixed() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g transform="translate(24,24)" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-500/75">
        <path d="M20 40V18L8 24v22l12-6Z" />
        <path d="M20 18l12 6v22l-12-6" />
        <path d="M8 24l12-6 12 6" />
      </g>
      <g transform="translate(86,28)" className="text-violet-500/75">
        <rect x="0" y="14" width="44" height="32" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M0 24h44M22 14V8M14 4h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(152,26)" className="text-amber-600/80">
        <path d="M6 46V22h36v24" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M2 46h44" stroke="currentColor" strokeWidth="2" />
        <path d="M18 46V34h12v12" fill="none" stroke="currentColor" strokeWidth="2" />
      </g>
      <g transform="translate(212,30)" className="text-emerald-600/75">
        <path d="M4 46 L28 22 L52 46 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M28 36v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function FigTrust() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500/75 dark:text-slate-400/70">
        <circle cx="64" cy="52" r="18" />
        <path d="M52 44c4-8 20-8 24 0M46 88c0-12 12-18 18-18s18 6 18 18" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500/75 dark:text-slate-400/70">
        <circle cx="216" cy="52" r="18" />
        <path d="M204 44c4-8 20-8 24 0M198 88c0-12 12-18 18-18s18 6 18 18" />
      </g>
      <path
        d="M128 36 L140 28 L152 36 V56c0 12-6 20-14 24-8-4-14-12-14-24Z"
        className="fill-emerald-500/25 stroke-emerald-500/85 dark:fill-emerald-400/20 dark:stroke-emerald-400/75"
        strokeWidth="2"
      />
      <path d="M134 52l6 6 12-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400" fill="none" />
    </svg>
  );
}

function FigCta() {
  return (
    <svg viewBox="0 0 280 120" className={svgBase} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="48" y="24" width="184" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-300/80" />
      <rect x="56" y="32" width="168" height="10" rx="2" className="fill-white/15" />
      <rect x="64" y="52" width="14" height="40" rx="2" className="fill-red-400/75" />
      <rect x="84" y="62" width="14" height="30" rx="2" className="fill-amber-400/75" />
      <rect x="104" y="48" width="14" height="44" rx="2" className="fill-yellow-400/75" />
      <rect x="124" y="58" width="14" height="34" rx="2" className="fill-blue-400/75" />
      <rect x="144" y="68" width="14" height="24" rx="2" className="fill-emerald-400/75" />
      <circle cx="230" cy="78" r="22" fill="currentColor" className="text-sky-400/90" />
      <path d="M222 78l8 8 14-16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95" />
    </svg>
  );
}

const FIGURES = {
  intro: FigIntro,
  wbgt: FigWbgt,
  hook: FigHookFixed,
  levels: FigLevels,
  problem: FigProblemFixed,
  solution: FigSolution,
  data: FigData,
  ops: FigOps,
  ledger: FigLedger,
  mobile: FigMobile,
  usecases: FigUsecasesFixed,
  trust: FigTrust,
  cta: FigCta,
};

export function ProductSlideFigure({ slideId, theme }) {
  const Fig = FIGURES[slideId];
  if (!Fig) return null;
  return (
    <figure className={`mx-auto w-full max-w-md ${wrapClass(theme)}`} aria-hidden>
      <Fig />
    </figure>
  );
}
