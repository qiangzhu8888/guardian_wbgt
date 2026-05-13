import { WBGT_ENV_GUIDELINES } from '../lib/wbgt.js';
import { LevelBadge, LiveBadge, MockBadge } from './MonitoringBadges.jsx';

/** @typedef {'dashboard' | 'detail'} WbgtGuidelinesVariant */

/**
 * @param {{ variant?: WbgtGuidelinesVariant }} props
 */
export function WbgtGuidelinesPanel({ variant = 'dashboard' }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-600 shadow-soft p-4 sm:p-5">
      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
        WBGT 危険度基準（環境省ガイドライン）
      </p>
      <div className="flex flex-wrap gap-3">
        {WBGT_ENV_GUIDELINES.map((item) => (
          <div key={item.badge} className="flex items-center gap-1.5">
            <LevelBadge level={item.badge} />
            <span className="text-xs text-gray-500 dark:text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
      {variant === 'dashboard' ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
          <LiveBadge /> = BUILDICSセンサーからのリアルタイムデータ（WBGT = 0.7 × 湿球温度 + 0.3 × 気温 で推定）
          {'　'}
          <MockBadge /> = デモ用サンプルデータ
        </p>
      ) : (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 leading-relaxed">
          上記の区分は、本画面上部の<strong className="text-slate-600 dark:text-slate-400">危険度バッジ</strong>
          ・履歴テーブル・グラフの色分け（WBGT 21℃／25℃／28℃／31℃ の境界）と対応しています。（センサーデータ由来の値は屋内・日陰向け簡易推定であり、屋外・直射日光下では過小評価になることがあります。環境省「熱中症予防情報サイト」なども併せてご確認ください。）
        </p>
      )}
    </div>
  );
}
