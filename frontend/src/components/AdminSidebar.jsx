import { NavLink } from 'react-router-dom';

/**
 * 管理コンソール左ナビ（幅 lg 以上は常設・未満はドロワー）
 * @param {object} props
 * @param {'dock' | 'drawer'} [props.variant]
 * @param {() => void} [props.onNavigate] リンク遷移時（モバイルではドロワーを閉じる）
 */

function SidebarLink({
  to,
  end,
  badge,
  children,
  emphasized,
  onNavigate,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={() => onNavigate?.()}
      className={({ isActive }) =>
        [
          'flex items-start gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold leading-snug transition-colors border',
          emphasized
            ? 'border-amber-300/70 bg-gradient-to-br from-amber-50/90 to-orange-50/70 text-amber-950 dark:border-amber-700/55 dark:from-amber-950/50 dark:to-orange-950/35 dark:text-amber-100'
            : 'border-transparent text-slate-700 dark:text-slate-200',
          isActive
            ? emphasized
              ? 'ring-2 ring-amber-400/80 shadow-sm'
              : 'bg-sky-600/12 text-sky-900 border-sky-300/55 dark:bg-sky-500/18 dark:text-sky-50 dark:border-sky-500/35'
            : emphasized
              ? 'hover:border-amber-400/90 hover:shadow-sm'
              : 'hover:bg-slate-100/90 dark:hover:bg-slate-800/80',
        ].join(' ')
      }
    >
      {badge != null ? (
        <span
          className="mt-0.5 inline-flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-lg bg-sky-600 text-[11px] font-bold text-white shadow-sm px-1"
          aria-hidden
        >
          {badge}
        </span>
      ) : emphasized ? (
        <span className="mt-0.5 text-sm shrink-0" aria-hidden>
          ★
        </span>
      ) : (
        <span className="w-6 shrink-0 opacity-70" aria-hidden>
          ›
        </span>
      )}
      <span className="flex-1 min-w-0">{children}</span>
    </NavLink>
  );
}

export default function AdminSidebar({ variant = 'dock', onNavigate, role, onCloseDrawer }) {
  const showPlatform = role === 'superadmin';
  const isDrawer = variant === 'drawer';

  return (
    <>
      {isDrawer ? (
        <div className="flex items-center justify-between gap-3 px-3 py-3 border-b border-slate-200/90 dark:border-slate-700/90 bg-slate-50/95 dark:bg-slate-900/95">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Console
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-transparent"
            onClick={onCloseDrawer}
            aria-label="メニューを閉じる"
          >
            閉じる
          </button>
        </div>
      ) : null}
      <nav className={`flex flex-col gap-1 p-3 ${isDrawer ? 'flex-1 min-h-0 overflow-y-auto' : ''}`} aria-label="管理メニュー">
        <SidebarLink to="/admin" end onNavigate={onNavigate}>
          ホーム・手順一覧
        </SidebarLink>
        <SidebarLink to="/admin/org-settings" onNavigate={onNavigate}>
          組織設定
        </SidebarLink>

        <p className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          セットアップ手順
        </p>
        <SidebarLink to="/admin/facilities" badge="1" onNavigate={onNavigate}>
          場所を追加・編集
        </SidebarLink>
        <SidebarLink to="/admin/devices" badge="2" onNavigate={onNavigate}>
          デバイス紐付け
        </SidebarLink>

        {showPlatform ? (
          <>
            <p className="px-3 pt-3 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800/85 dark:text-amber-200/85">
              プラットフォーム
            </p>
            <SidebarLink to="/admin/platform/orgs" emphasized onNavigate={onNavigate}>
              組織の追加
            </SidebarLink>
          </>
        ) : null}
      </nav>
    </>
  );
}
