/** BUILDICS 照会の参照時間（probeBuildicsDevice.js と同期） */
export const BUILDICS_PROBE_HISTORY_HOURS = 48;

/**
 * @typedef {'idle' | 'loading' | 'found' | 'not_found' | 'api_error' | 'not_configured'} BuildicsProbeUiStatus
 */

/**
 * @param {{ deviceId?: string, probing?: boolean, probe?: { deviceId?: string, buildicsStatus?: string } | null }} input
 * @returns {{ status: BuildicsProbeUiStatus, title: string, message: string }}
 */
export function describeBuildicsProbeUi(input) {
  const trimmed = String(input.deviceId || '').replace(/\D/g, '');
  if (!/^\d{6,24}$/.test(trimmed)) {
    return { status: 'idle', title: '', message: '' };
  }
  if (input.probing) {
    return {
      status: 'loading',
      title: 'BUILDICS 照会中',
      message: 'BUILDICS にこのデバイス ID があるか確認しています…',
    };
  }
  const probe = input.probe;
  if (!probe || probe.deviceId !== trimmed) {
    return { status: 'idle', title: '', message: '' };
  }

  const hours = BUILDICS_PROBE_HISTORY_HOURS;
  switch (probe.buildicsStatus) {
    case 'found':
      return {
        status: 'found',
        title: 'BUILDICS に登録あり',
        message: `直近 ${hours} 時間以内に BUILDICS から計測データを確認しました。`,
      };
    case 'not_found':
      return {
        status: 'not_found',
        title: 'BUILDICS に未確認',
        message: `直近 ${hours} 時間のデータが BUILDICS にありません。ID の誤り、未登録デバイス、または通信停止の可能性があります。`,
      };
    case 'api_error':
      return {
        status: 'api_error',
        title: 'BUILDICS 照会エラー',
        message: 'BUILDICS API への問い合わせに失敗しました。API キーとネットワークを確認してください。',
      };
    case 'not_configured':
      return {
        status: 'not_configured',
        title: 'BUILDICS 未設定',
        message: '組織の BUILDICS API キーが未設定のため、BUILDICS 上の有無を確認できません。',
      };
    default:
      return { status: 'idle', title: '', message: '' };
  }
}

/** @param {BuildicsProbeUiStatus} status */
export function buildicsProbeBadgeClass(status) {
  switch (status) {
    case 'found':
      return 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/45 dark:text-emerald-200 dark:border-emerald-800';
    case 'not_found':
      return 'bg-amber-50 text-amber-950 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800';
    case 'api_error':
      return 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800';
    case 'loading':
      return 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800';
    case 'not_configured':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600';
    default:
      return '';
  }
}
