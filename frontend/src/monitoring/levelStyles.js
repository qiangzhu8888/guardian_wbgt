import { getWBGTLevel } from '../lib/wbgt';

export const LEVEL_ORDER = { 危険: 0, 厳重警戒: 1, 警戒: 2, 注意: 3, ほぼ安全: 4, 通信異常: 5 };

export function getLevelStyle(level) {
  switch (level) {
    case '危険':
      return {
        badge: 'bg-red-100 text-red-700 border border-red-300',
        text: 'text-red-600',
        cardBorder: 'border-l-4 border-l-red-500',
        bg: 'bg-red-50',
        dot: 'bg-red-500',
        alert: 'bg-red-50 border-red-200 text-red-800',
        summary: 'bg-red-50 border-red-100',
        summaryText: 'text-red-600',
        summaryDot: 'bg-red-500',
      };
    case '厳重警戒':
      return {
        badge: 'bg-orange-100 text-orange-700 border border-orange-300',
        text: 'text-orange-600',
        cardBorder: 'border-l-4 border-l-orange-500',
        bg: 'bg-orange-50',
        dot: 'bg-orange-500',
        alert: 'bg-orange-50 border-orange-200 text-orange-800',
        summary: 'bg-orange-50 border-orange-100',
        summaryText: 'text-orange-600',
        summaryDot: 'bg-orange-500',
      };
    case '警戒':
      return {
        badge: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
        text: 'text-yellow-600',
        cardBorder: 'border-l-4 border-l-yellow-400',
        bg: 'bg-yellow-50',
        dot: 'bg-yellow-400',
        alert: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        summary: 'bg-yellow-50 border-yellow-100',
        summaryText: 'text-yellow-600',
        summaryDot: 'bg-yellow-400',
      };
    case '注意':
      return {
        badge: 'bg-blue-100 text-blue-700 border border-blue-300',
        text: 'text-blue-600',
        cardBorder: 'border-l-4 border-l-blue-400',
        bg: 'bg-blue-50',
        dot: 'bg-blue-400',
        alert: 'bg-blue-50 border-blue-200 text-blue-800',
        summary: 'bg-blue-50 border-blue-100',
        summaryText: 'text-blue-600',
        summaryDot: 'bg-blue-400',
      };
    case 'ほぼ安全':
      return {
        badge: 'bg-green-100 text-green-700 border border-green-300',
        text: 'text-green-600',
        cardBorder: 'border-l-4 border-l-green-400',
        bg: 'bg-green-50',
        dot: 'bg-green-400',
        alert: 'bg-green-50 border-green-200 text-green-800',
        summary: 'bg-green-50 border-green-100',
        summaryText: 'text-green-600',
        summaryDot: 'bg-green-400',
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-600 border border-gray-300',
        text: 'text-gray-500',
        cardBorder: 'border-l-4 border-l-gray-400',
        bg: 'bg-gray-50',
        dot: 'bg-gray-400',
        alert: 'bg-gray-50 border-gray-200 text-gray-700',
        summary: 'bg-gray-50 border-gray-100',
        summaryText: 'text-gray-500',
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

export function wbgtNextLevel(wbgtNext) {
  return getWBGTLevel(wbgtNext);
}
