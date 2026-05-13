import { getLevelStyle } from './levelStyles';

export function LevelBadge({ level, size = 'sm' }) {
  const style = getLevelStyle(level);
  const sizeClass =
    size === 'lg' ? 'px-3 py-1 text-sm font-bold' : 'px-2.5 py-0.5 text-xs font-semibold';
  return (
    <span className={`inline-flex items-center rounded-full ${sizeClass} ${style.badge}`}>{level}</span>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      LIVE
    </span>
  );
}

export function MockBadge() {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600">
      デモ
    </span>
  );
}
