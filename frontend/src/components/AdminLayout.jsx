import { Link, useNavigate } from 'react-router-dom';
import { monitorHomePath } from '../lib/orgRoute';
import { getAuthUser, requestAdminLogout } from '../lib/authSession';

const WIDTH = /** @type {const} */ ({
  narrow: 'max-w-lg',
  medium: 'max-w-2xl',
  wide: 'max-w-5xl',
});

/**
 * 管理画面共通シェル（ヘッダー・ページ見出し・幅）
 * @param {object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.description]
 * @param {'narrow' | 'medium' | 'wide'} [props.width]
 * @param {import('react').ReactNode} [props.headerActions] ヘッダー右寄せ・「監視画面」の左に並べる補助リンク
 * @param {import('react').ReactNode} props.children
 */
export default function AdminLayout({ title, description, width = 'wide', headerActions, children }) {
  const nav = useNavigate();
  const user = getAuthUser();

  async function handleLogout() {
    await requestAdminLogout();
    nav('/admin/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell-header">
        <div className="admin-shell-header-inner">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to="/admin" className="admin-shell-brand" title="管理メニューへ">
              <span className="admin-shell-brand-icon" aria-hidden>
                ⌂
              </span>
              <span className="admin-shell-brand-text">WBGT 管理</span>
            </Link>
            <div className="hidden sm:flex flex-col min-w-0 gap-0.5 text-left">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Console</span>
              {user?.email ? (
                <span className="text-xs text-sky-100/95 truncate max-w-[160px] md:max-w-[240px]" title={user.email}>
                  {user.email}
                </span>
              ) : null}
            </div>
            {user?.role === 'superadmin' ? (
              <span className="admin-role-badge-header shrink-0 hidden sm:inline-flex">superadmin</span>
            ) : user?.role ? (
              <span className="admin-role-badge-header admin-role-badge-header-muted shrink-0 hidden sm:inline-flex">
                {user.role}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            {headerActions}
            <Link to={monitorHomePath(user?.orgSlug)} className="btn-admin-toolbar">
              監視画面を開く
            </Link>
            <button type="button" onClick={handleLogout} className="btn-admin-logout">
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="admin-shell-main">
        <div className={`${WIDTH[width]} mx-auto px-4 sm:px-6 py-6 sm:py-8`}>
          <div className="admin-page-intro">
            <h1 className="admin-page-title">{title}</h1>
            {description ? <div className="admin-page-description">{description}</div> : null}
          </div>
          <div className="admin-page-body">{children}</div>
        </div>
      </main>
    </div>
  );
}
