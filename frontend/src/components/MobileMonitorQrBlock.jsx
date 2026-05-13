import { useCallback, useState } from 'react';
import QRCode from 'react-qr-code';
import { publicOrgDashboardAbsoluteUrl } from '../lib/orgRoute';

/**
 * 公開監視画面（テナント別）の絶対 URL を QR 表示する。
 * @param {object} props
 * @param {unknown} [props.orgSlug]
 * @param {'monitor' | 'admin'} [props.variant]
 * @param {string} [props.className]
 * @param {boolean} [props.compact] QR をやや小さく（管理ヘッダー下など）
 */
export default function MobileMonitorQrBlock({
  orgSlug,
  variant = 'monitor',
  className = '',
  compact = false,
}) {
  const url = publicOrgDashboardAbsoluteUrl(orgSlug);
  const size = compact ? 92 : 128;
  const [copied, setCopied] = useState(false);
  const [copyErr, setCopyErr] = useState('');

  const onCopy = useCallback(async () => {
    setCopyErr('');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('clipboard write failed', e);
      setCopyErr('コピーに失敗しました。URL を長押しして選択してください。');
    }
  }, [url]);

  const shell =
    variant === 'admin'
      ? 'rounded-xl border border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-900/95 shadow-sm'
      : 'rounded-xl border border-slate-200/90 dark:border-slate-600/80 bg-white dark:bg-slate-900 shadow-soft';

  const title =
    variant === 'admin'
      ? 'スマホ用・公開監視画面（QR）'
      : 'スマホでこの監視画面を開く';

  return (
    <section
      className={`${shell} p-4 sm:p-5 ${className}`.trim()}
      aria-labelledby="mobile-monitor-qr-heading"
    >
      <h2 id="mobile-monitor-qr-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
        {title}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
        QR を読み取ると、この組織の監視ダッシュボードが開きます。別の端末やホーム画面ショートカットの作成にも使えます。
      </p>
      <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
        <div className="shrink-0 rounded-lg bg-white p-2 border border-slate-100 shadow-inner mx-auto sm:mx-0">
          <QRCode value={url} size={size} level="M" fgColor="#0f172a" bgColor="#ffffff" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all leading-snug">{url}</p>
          <button
            type="button"
            onClick={onCopy}
            className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline underline-offset-2 touch-manipulation py-1"
          >
            {copied ? 'コピーしました' : 'URL をコピー'}
          </button>
          {copyErr ? <p className="text-xs text-red-700 dark:text-red-300">{copyErr}</p> : null}
        </div>
      </div>
    </section>
  );
}
