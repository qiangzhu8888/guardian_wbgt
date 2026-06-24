/**
 * 座標未設定・API 失敗など、参考情報ブロック向けの注意表示
 * @param {{ variant?: 'info'|'warn'|'error', title: string, message: string, detail?: string|null, statusCode?: number|null }} props
 */
export default function GeoReferenceNotice({
  variant = 'info',
  title,
  message,
  detail = null,
  statusCode = null,
}) {
  const styles =
    variant === 'error'
      ? 'border-red-200 dark:border-red-900/50 bg-red-50/90 dark:bg-red-950/30 text-red-900 dark:text-red-200'
      : variant === 'warn'
        ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100'
        : 'border-sky-200 dark:border-sky-900/45 bg-sky-50/80 dark:bg-sky-950/25 text-sky-950 dark:text-sky-100';

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${styles}`} role="status">
      <p className="font-bold text-sm mb-1">
        {title}
        {statusCode != null ? (
          <span className="ml-2 font-mono text-[10px] opacity-70">HTTP {statusCode}</span>
        ) : null}
      </p>
      <p>{message}</p>
      {detail ? <p className="mt-2 text-[11px] opacity-85 whitespace-pre-wrap">{detail}</p> : null}
    </div>
  );
}
