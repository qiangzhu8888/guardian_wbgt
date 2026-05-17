import { useCallback, useState } from 'react';
import QRCode from 'react-qr-code';
import { publicOrgDashboardAbsoluteUrl } from '../lib/orgRoute';

/**
 * 公開監視画面（テナント別）の絶対 URL を QR 表示する。
 * @param {object} props
 * @param {unknown} [props.orgSlug]
 * @param {'monitor' | 'admin'} [props.variant]
 * @param {string} [props.className]
 * @param {boolean} [props.compact] QR をやや小さく
 * @param {'card' | 'header'} [props.layout] card=従来の枠／header=ヘッダ内の横並び（説明文なし）
 */
export default function MobileMonitorQrBlock({
  orgSlug,
  variant = 'monitor',
  className = '',
  compact = false,
  layout = 'card',
}) {
  const url = publicOrgDashboardAbsoluteUrl(orgSlug);
  const sizeCard = compact ? 92 : 128;
  /** ヘッダ用はさらに小さめ */
  const sizeHeader = compact ? 56 : 68;
  const size = layout === 'header' ? sizeHeader : sizeCard;
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

  const heading =
    layout === 'header'
      ? 'スマホで開く'
      : variant === 'admin'
        ? 'スマホ用・公開監視画面（QR）'
        : 'スマホでこの監視画面を開く';

  if (layout === 'header') {
    const headingId = 'mobile-monitor-qr-heading';
    const headingClass =
      variant === 'admin'
        ? 'text-[11px] font-bold text-sky-100/95 leading-tight'
        : 'text-[11px] font-bold text-white drop-shadow-sm leading-tight';

    const copyBtnClass =
      variant === 'admin'
        ? 'text-[11px] font-semibold text-sky-200 hover:text-white hover:underline underline-offset-2 touch-manipulation py-0.5'
        : 'text-[11px] font-semibold text-sky-100 hover:text-white hover:underline underline-offset-2 touch-manipulation py-0.5';

    const copyErrClass = variant === 'admin' ? 'text-[11px] text-amber-200' : 'text-[11px] text-amber-100';

    return (
      <div
        className={`flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 ${className}`.trim()}
        role="region"
        aria-labelledby={headingId}
      >
        <p id={headingId} className={`${headingClass} shrink-0 whitespace-nowrap`}>
          {heading}
        </p>
        <div className="shrink-0 rounded-md bg-white p-0.5 sm:p-1 border border-white/40 shadow-sm">
          <QRCode value={url} size={size} level="M" fgColor="#0f172a" bgColor="#ffffff" aria-hidden />
        </div>
        <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1">
          <span className="sr-only">{url}</span>
          <button type="button" onClick={onCopy} className={copyBtnClass}>
            {copied ? 'コピーしました' : 'URL をコピー'}
          </button>
          {copyErr ? <p className={`${copyErrClass} shrink-0`}>{copyErr}</p> : null}
        </div>
      </div>
    );
  }

  const shell =
    variant === 'admin'
      ? 'rounded-xl border border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-900/95 shadow-sm'
      : 'rounded-xl border border-slate-200/90 dark:border-slate-600/80 bg-white dark:bg-slate-900 shadow-soft';

  return (
    <section
      className={`${shell} p-4 sm:p-5 ${className}`.trim()}
      aria-labelledby="mobile-monitor-qr-heading"
    >
      <h2 id="mobile-monitor-qr-heading" className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
        {heading}
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
