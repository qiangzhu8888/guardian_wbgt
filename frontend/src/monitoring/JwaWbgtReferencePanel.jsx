import { useEffect, useState } from 'react';
import { fetchJwaHourlyForecast } from '../lib/jwaWbgtApi';
import { LevelBadge } from './MonitoringBadges.jsx';

/**
 * 施設の緯度経度に基づく JWA WBGT 予測（参考表示）
 * @param {{ lat?: number, lng?: number }} props
 */
export function JwaWbgtReferencePanel({ lat, lng }) {
  const [state, setState] = useState({ phase: 'idle', payload: null, err: null });

  useEffect(() => {
    const hasLL = Number.isFinite(lat) && Number.isFinite(lng);
    if (!hasLL) {
      setState({ phase: 'no_coords', payload: null, err: null });
      return;
    }
    let cancelled = false;
    setState({ phase: 'loading', payload: null, err: null });
    (async () => {
      const r = await fetchJwaHourlyForecast(lat, lng);
      if (cancelled) return;
      if (!r.ok) {
        setState({
          phase: r.status === 503 ? 'unconfigured' : 'error',
          payload: null,
          err: r.msg,
        });
        return;
      }
      setState({ phase: 'ok', payload: r.json, err: null });
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (state.phase === 'no_coords' || state.phase === 'idle') return null;

  if (state.phase === 'loading') {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        付近の WBGT 予測（日本気象協会・参考）を読み込み中…
      </div>
    );
  }

  if (state.phase === 'unconfigured') {
    return null;
  }

  if (state.phase === 'error') {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
        参考 WBGT（JWA）の取得に失敗しました。{state.err ? `（${state.err}）` : null}
      </div>
    );
  }

  const rows = Array.isArray(state.payload?.data) ? state.payload.data : [];
  const preview = rows.slice(0, 12);
  const mesh = state.payload?.meshCode;
  const refTime = state.payload?.referenceTime;
  const attribution = state.payload?.attribution || '日本気象協会（JWA）WBGT API（参考）';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-sky-50/80 dark:bg-sky-950/25">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">付近の WBGT 予測（参考）</h3>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {attribution}。現地センサー値とは異なる場合があります（1km メッシュ予測）。
        </p>
        {(mesh || refTime) && (
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 tabular-nums">
            {mesh ? `メッシュ ${mesh}` : null}
            {mesh && refTime ? ' · ' : null}
            {refTime ? `基準 ${refTime}` : null}
          </p>
        )}
      </div>
      {preview.length === 0 ? (
        <p className="px-4 py-3 text-xs text-slate-500">予測データがありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="px-3 py-2 font-semibold">時刻（JST）</th>
                <th className="px-3 py-2 font-semibold">WBGT</th>
                <th className="px-3 py-2 font-semibold">ランク</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={`${row.time}-${i}`} className="border-b border-slate-50 dark:border-slate-800/80">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap tabular-nums">
                    {row.time
                      ? (() => {
                          try {
                            return new Date(row.time).toLocaleString('ja-JP', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          } catch {
                            return row.time;
                          }
                        })()
                      : '—'}
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {row.wbgtCelsius != null ? `${row.wbgtCelsius}℃` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {row.level ? <LevelBadge level={row.level} /> : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
