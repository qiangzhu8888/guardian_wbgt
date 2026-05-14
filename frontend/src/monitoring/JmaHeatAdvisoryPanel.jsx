import { useEffect, useState } from 'react';
import { fetchJmaHeatAdvisory } from '../lib/jmaHeatAdvisoryApi';

/**
 * 気象庁「熱中症警戒アラート」（VPFT50）参考。緯度経度から都道府県を判定。
 * @param {{ lat?: number, lng?: number }} props
 */
export function JmaHeatAdvisoryPanel({ lat, lng }) {
  const [state, setState] = useState({ phase: 'idle', payload: null, err: null });

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setState({ phase: 'no_coords', payload: null, err: null });
      return;
    }
    let cancelled = false;
    setState({ phase: 'loading', payload: null, err: null });
    (async () => {
      const r = await fetchJmaHeatAdvisory(lat, lng);
      if (cancelled) return;
      if (!r.ok) {
        setState({ phase: 'error', payload: null, err: r.msg });
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
        気象庁・熱中症警戒アラート（参考）を読み込み中…
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
        気象庁参照情報の取得に失敗しました。{state.err ? `（${state.err}）` : null}
      </div>
    );
  }

  const p = state.payload || {};
  const active = p.active === true;
  const pref = p.prefName || '—';
  const attribution =
    p.attribution || '気象庁 防災情報 XML（熱中症警戒アラート・参考）';
  const xmlUrl = typeof p.advisoryXmlUrl === 'string' ? p.advisoryXmlUrl : null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-amber-50/70 dark:bg-amber-950/20">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
          熱中症警戒アラート（気象庁・参考）
        </h3>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {attribution}。地点から都道府県（{pref}）を推定しています。JWA のような地点別の WBGT
          数値予報ではなく、日最高 WBGT 33℃ 以上が予想される場合の広域アラートです。
        </p>
      </div>
      <div className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        {active ? (
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/25 px-3 py-2">
            <p className="font-semibold text-red-900 dark:text-red-200">該当エリアに発表がある可能性があります</p>
            {p.headline ? <p className="mt-1 text-red-900/90 dark:text-red-100/90">{p.headline}</p> : null}
            {p.detail ? (
              <p className="mt-2 text-[11px] leading-relaxed text-red-950/85 dark:text-red-100/80 whitespace-pre-wrap">
                {p.detail}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">
            現在、フィード上でこの地点の都道府県向けの熱中症警戒アラート（VPFT50）を特定できませんでした。
            {p.reason === 'no_vpft50_in_feed'
              ? ' 未発表・シーズン外のことがあります。'
              : ' 広域のみの表記で地名が本文に無い場合があります。'}
          </p>
        )}
        {p.note ? <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed">{p.note}</p> : null}
        {xmlUrl ? (
          <p>
            <a
              href={xmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 underline text-[11px]"
            >
              気象庁 XML 電文を開く
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
