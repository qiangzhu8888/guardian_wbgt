import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeFullscreenControls from './ThemeFullscreenControls';
import MobileMonitorQrBlock from './MobileMonitorQrBlock';
import AdminSidebar from './AdminSidebar';
import { monitorHomePath } from '../lib/orgRoute';
import { NOTIFICATIONS_PATH } from '../lib/productLandingCta';
import { APP_DISPLAY_NAME, DEFAULT_APP_LOGO_URL, PRODUCTION_COMPANY_NAME } from '../lib/appBranding';
import { getAppReleaseVersion } from '../lib/appRelease';
import { getAuthUser, requestAdminLogout } from '../lib/authSession';
import { switchAdminOrg } from '../lib/publicApi';

const WIDTH = /** @type {const} */ ({
  narrow: 'max-w-lg',
  medium: 'max-w-2xl',
  wide: 'max-w-5xl',
});

/**
 * 管理画面共通シェル（サイドナビ・ヘッダー・ページ見出し・幅）
 * @param {object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.description]
 * @param {'narrow' | 'medium' | 'wide'} [props.width]
 * @param {import('react').ReactNode} [props.headerActions] ヘッダー右寄せ・「監視画面」の左に並べる補助リンク
 * @param {import('react').ReactNode} props.children
 */
export default function AdminLayout({ title, description, width = 'wide', headerActions, children }) {
  const nav = useNavigate();
  const location = useLocation();
  const appVersion = getAppReleaseVersion();
  const user = getAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  useEffect(() => {
    if (user?.role === 'viewer') {
      nav(NOTIFICATIONS_PATH, { replace: true });
    }
  }, [nav, user?.role]);
  /** @type {Array<{ orgId: string, orgSlug: string }>} */
  const orgs =
    Array.isArray(user?.orgs) && user.orgs.every((x) => x && typeof x.orgId === 'string')
      ? user.orgs.filter((x) => String(x.orgId).trim())
      : [];
  const multiOrgSwitcher = orgs.length > 1;
  const [orgSwitchBusy, setOrgSwitchBusy] = useState(false);
  const [orgSwitchErr, setOrgSwitchErr] = useState('');

  async function handleLogout() {
    await requestAdminLogout();
    nav('/admin/login', { replace: true });
  }

  async function handleOrgPickerChange(ev) {
    const nextOid = ev.target?.value ?? '';
    if (!nextOid || nextOid === user?.orgId || orgSwitchBusy) return;
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
    if (!token) return;
    setOrgSwitchErr('');
    setOrgSwitchBusy(true);
    try {
      const result = await switchAdminOrg(token, nextOid);
      if (!result._ok || !result.accessToken) {
        console.error('organization switch failed', result);
        setOrgSwitchBusy(false);
        setOrgSwitchErr(
          typeof result.msg === 'string' && result.msg
            ? result.msg
            : '組織の切り替えに失敗しました。時間をおいて再度お試しください。',
        );
        return;
      }
      sessionStorage.setItem('accessToken', result.accessToken);
      if (result.user && typeof result.user === 'object') {
        sessionStorage.setItem('authUser', JSON.stringify(result.user));
      }
      window.location.reload();
    } catch (e) {
      console.error('organization switch failed', e);
      setOrgSwitchBusy(false);
      setOrgSwitchErr('組織の切り替えに失敗しました。通信状況をご確認ください。');
    }
  }

  const navRole = typeof user?.role === 'string' ? user.role : '';

  return (
    <div className="admin-shell flex flex-col min-h-[100dvh]">
      <header className="admin-shell-header">
        <div className="admin-shell-header-inner">
          <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
            <button
              type="button"
              id="admin-sidebar-open"
              className="lg:hidden inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-2.5 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar-drawer"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="text-base leading-none" aria-hidden>
                ☰
              </span>
              メニュー
            </button>
            <Link to="/admin" className="admin-shell-brand" title="管理メニューへ">
              <img
                src={DEFAULT_APP_LOGO_URL}
                alt=""
                width={120}
                height={32}
                className="h-8 w-auto max-w-[120px] object-contain shrink-0 rounded opacity-95"
              />
              <span
                className="admin-shell-brand-text min-w-0 truncate max-w-[min(100vw-8rem,24rem)]"
                title={APP_DISPLAY_NAME}
              >
                {APP_DISPLAY_NAME}
              </span>
            </Link>
            {appVersion ? (
              <span
                className="shrink-0 tabular-nums rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-100/90"
                title={`ビルド ${appVersion}`}
              >
                v{appVersion}
              </span>
            ) : null}
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
            {multiOrgSwitcher ? (
              <div className="flex flex-col gap-1 w-full sm:w-auto shrink-0 basis-full sm:basis-auto pt-2 sm:pt-0 border-t border-white/15 sm:border-0">
                <label className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">操作中の組織</span>
                  <select
                    className="input-field py-1.5 text-xs flex-1 min-w-[10rem] max-w-[min(100vw-2rem,20rem)]"
                    value={user?.orgId || ''}
                    disabled={orgSwitchBusy}
                    onChange={handleOrgPickerChange}
                    aria-busy={orgSwitchBusy || undefined}
                    aria-invalid={Boolean(orgSwitchErr)}
                    aria-describedby={orgSwitchErr ? 'admin-org-switch-err' : undefined}
                  >
                    {orgs.map((o) => (
                      <option key={o.orgId} value={o.orgId}>
                        {o.orgSlug || o.orgId}
                      </option>
                    ))}
                  </select>
                </label>
                {orgSwitchErr ? (
                  <p
                    id="admin-org-switch-err"
                    className="text-[11px] text-amber-100 bg-amber-950/35 border border-amber-500/30 rounded-lg px-2 py-1.5"
                    role="alert"
                  >
                    {orgSwitchErr}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            <ThemeFullscreenControls variant="admin" />
            <Link to="/manual" className="btn-admin-toolbar-ghost">
              マニュアル
            </Link>
            <Link to={NOTIFICATIONS_PATH} className="btn-admin-toolbar-ghost">
              通知
            </Link>
            <MobileMonitorQrBlock
              orgSlug={user?.orgSlug}
              variant="admin"
              layout="header"
              compact
              className="basis-full lg:basis-auto justify-end lg:flex-initial border-t border-white/15 lg:border-0 pt-2 lg:pt-0 mt-1 lg:mt-0 lg:mr-2"
            />
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

      <div className="flex flex-1 min-h-0 w-full">
        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-[38] bg-slate-900/55 lg:hidden"
            aria-label="メニューを閉じる"
            tabIndex={-1}
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside className="admin-sidebar-dock hidden lg:flex lg:w-[15rem] xl:w-[15.75rem] shrink-0 flex-col border-r border-slate-200/90 dark:border-slate-700/70 bg-white/92 dark:bg-slate-900/92 backdrop-blur-sm lg:sticky lg:top-[3.625rem] lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <AdminSidebar variant="dock" role={navRole} />
        </aside>

        <aside
          id="admin-sidebar-drawer"
          className={`fixed lg:hidden top-14 left-0 bottom-0 z-[45] flex w-[min(18rem,calc(100vw-1.25rem))] flex-col border-r border-slate-200/90 dark:border-slate-700/70 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-200 ease-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          }`}
          aria-hidden={!sidebarOpen}
        >
          <AdminSidebar
            variant="drawer"
            role={navRole}
            onNavigate={() => setSidebarOpen(false)}
            onCloseDrawer={() => setSidebarOpen(false)}
          />
        </aside>

        <div className="flex flex-1 min-w-0 min-h-0 flex-col">
          <main className="admin-shell-main flex-1 flex flex-col">
            <div className={`${WIDTH[width]} w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1`}>
              <div className="admin-page-intro">
                <h1 className="admin-page-title">{title}</h1>
                {description ? <div className="admin-page-description">{description}</div> : null}
              </div>
              <div className="admin-page-body">{children}</div>
            </div>
          </main>

          <footer className="border-t border-slate-200/80 dark:border-slate-800 py-3 px-4 text-center text-[10px] text-slate-500 dark:text-slate-500 shrink-0 mt-auto bg-slate-50/40 dark:bg-slate-950/50">
            制作・開発：{PRODUCTION_COMPANY_NAME}
          </footer>
        </div>
      </div>
    </div>
  );
}
