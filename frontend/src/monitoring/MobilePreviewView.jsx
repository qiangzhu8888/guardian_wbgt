import { getLevelStyle, wbgtNextLevel } from './levelStyles';
import { LevelBadge } from './DashboardView';

export function MobilePreviewView({ facilities, anomalySensor }) {
  const top = facilities[0];

  return (
    <div className="flex flex-col items-center py-8">
      <p className="text-sm font-medium text-slate-500 mb-6">スマートフォン表示イメージ（320 × 640 相当）</p>
      <div
        className="relative w-80 bg-white rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/10 border-[3px] border-slate-800 overflow-hidden"
        style={{ height: 640 }}
      >
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs flex items-center justify-between px-5 py-2">
          <span>{new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-xs">北里地区 WBGT</span>
          <span>📶 🔋</span>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-4 py-3.5 shadow-inner">
          <h1 className="text-sm font-bold">北里地区 熱中症監視</h1>
          <p className="text-xs text-slate-400 mt-0.5">リアルタイム更新 · LIVE</p>
        </div>

        <div className="overflow-y-auto" style={{ height: 500 }}>
          {top && top.level !== 'ほぼ安全' && (
            <div className={`mx-3 mt-3 rounded-xl border p-3 ${getLevelStyle(top.level).alert}`}>
              <p className="text-xs font-semibold leading-snug">
                ⚠️ {top.name}は{top.level}
                <br />
                <span className="font-normal">
                  1時間後: {wbgtNextLevel(top.wbgtNext)}予測
                </span>
              </p>
            </div>
          )}

          <div className="px-3 mt-3 space-y-2">
            {facilities.map((f) => {
              const style = getLevelStyle(f.level);
              const nextLvl = wbgtNextLevel(f.wbgtNext);
              const nextStyle = getLevelStyle(nextLvl);
              return (
                <div
                  key={f.id}
                  className={`rounded-xl bg-white shadow-md border border-slate-100/90 ${style.cardBorder} p-3`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1 flex-1 min-w-0 mr-1">
                      {!f.isMock && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                      )}
                      <span className="text-xs font-bold text-gray-800 truncate">{f.name}</span>
                    </div>
                    <LevelBadge level={f.level} />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400">現在 WBGT</p>
                      <p className={`text-3xl font-extrabold leading-none ${style.text}`}>
                        {f.wbgt}
                        <span className="text-xs font-normal text-gray-400 ml-0.5">℃</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">1時間後</p>
                      <p className={`text-lg font-bold ${nextStyle.text}`}>{f.wbgtNext}℃</p>
                      <LevelBadge level={nextLvl} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">更新 {f.updated}</p>
                </div>
              );
            })}

            <div className="rounded-xl bg-white border border-gray-100 border-l-4 border-l-gray-400 p-3 opacity-70">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-600">{anomalySensor?.name}</span>
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-300">
                  通信異常
                </span>
              </div>
              <p className="text-3xl font-extrabold text-gray-300 leading-none">--.-</p>
              <p className="text-xs text-gray-400 mt-1.5">最終受信 {anomalySensor?.lastSeen}</p>
            </div>
          </div>
          <div className="h-14" />
        </div>

        {top && (
          <div
            className={`absolute bottom-0 left-0 right-0 text-white text-xs font-bold px-4 py-2.5 flex items-center gap-2 ${
              top.level === '危険'
                ? 'bg-red-500'
                : top.level === '厳重警戒'
                  ? 'bg-orange-500'
                  : top.level === '警戒'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
            }`}
          >
            <span className="animate-pulse">🔴</span>
            <span>
              {top.name}は{top.level}　→ 詳細確認
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-4">実際のスマートフォンブラウザでもこのレイアウトで表示されます</p>
    </div>
  );
}
