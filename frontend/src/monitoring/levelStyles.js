export const LEVEL_ORDER = { 危険: 0, 厳重警戒: 1, 警戒: 2, 注意: 3, ほぼ安全: 4, 通信異常: 5 };

export function getLevelStyle(level) {
  switch (level) {
    case '危険':
      return {
        badge:
          'bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/55 dark:text-red-200 dark:border-red-800',
        text: 'text-red-600 dark:text-red-400',
        cardBorder: 'border-l-4 border-l-red-500',
        bg: 'bg-red-50 dark:bg-red-950/35',
        dot: 'bg-red-500',
        alert:
          'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800/80 dark:text-red-100',
        summary: 'bg-red-50 border-red-100 dark:bg-red-950/40 dark:border-red-900/60',
        summaryText: 'text-red-600 dark:text-red-400',
        summaryDot: 'bg-red-500',
      };
    case '厳重警戒':
      return {
        badge:
          'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800',
        text: 'text-orange-600 dark:text-orange-400',
        cardBorder: 'border-l-4 border-l-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        dot: 'bg-orange-500',
        alert:
          'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/35 dark:border-orange-800/80 dark:text-orange-100',
        summary: 'bg-orange-50 border-orange-100 dark:bg-orange-950/35 dark:border-orange-900/55',
        summaryText: 'text-orange-600 dark:text-orange-400',
        summaryDot: 'bg-orange-500',
      };
    case '警戒':
      return {
        badge:
          'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-950/45 dark:text-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-600 dark:text-yellow-400',
        cardBorder: 'border-l-4 border-l-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-950/25',
        dot: 'bg-yellow-400',
        alert:
          'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800/70 dark:text-yellow-100',
        summary: 'bg-yellow-50 border-yellow-100 dark:bg-yellow-950/30 dark:border-yellow-900/50',
        summaryText: 'text-yellow-600 dark:text-yellow-400',
        summaryDot: 'bg-yellow-400',
      };
    case '注意':
      return {
        badge:
          'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
        cardBorder: 'border-l-4 border-l-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        dot: 'bg-blue-400',
        alert:
          'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/35 dark:border-blue-800/70 dark:text-blue-100',
        summary: 'bg-blue-50 border-blue-100 dark:bg-blue-950/35 dark:border-blue-900/55',
        summaryText: 'text-blue-600 dark:text-blue-400',
        summaryDot: 'bg-blue-400',
      };
    case 'ほぼ安全':
      return {
        badge:
          'bg-green-100 text-green-700 border border-green-300 dark:bg-emerald-950/45 dark:text-emerald-200 dark:border-emerald-800',
        text: 'text-green-600 dark:text-green-400',
        cardBorder: 'border-l-4 border-l-green-400',
        bg: 'bg-green-50 dark:bg-emerald-950/25',
        dot: 'bg-green-400',
        alert:
          'bg-green-50 border-green-200 text-green-800 dark:bg-emerald-950/30 dark:border-emerald-800/70 dark:text-emerald-100',
        summary: 'bg-green-50 border-green-100 dark:bg-emerald-950/28 dark:border-emerald-900/50',
        summaryText: 'text-green-600 dark:text-green-400',
        summaryDot: 'bg-green-400',
      };
    default:
      return {
        badge:
          'bg-gray-100 text-gray-600 border border-gray-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
        text: 'text-gray-500 dark:text-slate-400',
        cardBorder: 'border-l-4 border-l-gray-400',
        bg: 'bg-gray-50 dark:bg-slate-900/60',
        dot: 'bg-gray-400',
        alert:
          'bg-gray-50 border-gray-200 text-gray-700 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200',
        summary: 'bg-gray-50 border-gray-100 dark:bg-slate-900/50 dark:border-slate-700',
        summaryText: 'text-gray-500 dark:text-slate-400',
        summaryDot: 'bg-gray-400',
      };
  }
}

export function getWbgtColor(wbgt) {
  if (wbgt >= 33) return '#ef4444';
  if (wbgt >= 31) return '#f97316';
  if (wbgt >= 28) return '#eab308';
  if (wbgt >= 25) return '#3b82f6';
  if (wbgt >= 21) return '#22c55e';
  return '#6b7280';
}
