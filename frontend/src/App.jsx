import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import PwaInstallBanner from './components/PwaInstallBanner';
import ProductLandingPage from './pages/ProductLandingPage';
import { monitorHomePath } from './lib/orgRoute';
import { applyColorScheme } from './lib/themeInit';

const ChangelogPage = lazy(() => import('./pages/ChangelogPage.jsx'));
const AdminManualPage = lazy(() => import('./pages/AdminManualPage.jsx'));
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx'));
const ProductSlidesPage = lazy(() => import('./pages/ProductSlidesPage.jsx'));
const ProductSpecsPage = lazy(() => import('./pages/ProductSpecsPage.jsx'));
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const AdminHome = lazy(() => import('./pages/AdminHome.jsx'));
const AdminDevices = lazy(() => import('./pages/AdminDevices.jsx'));
const AdminFacilities = lazy(() => import('./pages/AdminFacilities.jsx'));
const AdminOrgSettings = lazy(() => import('./pages/AdminOrgSettings.jsx'));
const AdminPlatformOrgs = lazy(() => import('./pages/AdminPlatformOrgs.jsx'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage.jsx'));

function LegacyORedirectToTenant() {
  const { orgSlug } = useParams();
  return <Navigate to={monitorHomePath(orgSlug)} replace />;
}

/** コード分割ルート読み込み中（監視・管理・資料ページは個別チャンク） */
function RouteFallback() {
  return (
    <div className="min-h-[50dvh] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-100 to-white dark:from-slate-950 dark:to-slate-900 px-4">
      <div
        className="h-10 w-10 rounded-full border-[3px] border-sky-500 border-t-transparent animate-spin"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">読み込み中…</p>
    </div>
  );
}

/** 管理コンソール以外で PWA / ホーム追加の案内バナーを出す */
function PwaInstallGate() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return <PwaInstallBanner />;
}

/** 未保存の配色では OS のダークモード変更に追従 */
function SystemColorSchemeSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyColorScheme();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SystemColorSchemeSync />
      <PwaInstallGate />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<ProductLandingPage />} />
          <Route path="/product" element={<Navigate to="/" replace />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/manual" element={<AdminManualPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/slides" element={<ProductSlidesPage />} />
          <Route path="/specs" element={<ProductSpecsPage />} />
          <Route path="/notifications" element={<NotificationSettingsPage />} />
          <Route path="/tenant" element={<Navigate to={monitorHomePath()} replace />} />
          <Route path="/tenant/:orgSlug" element={<HomePage />} />
          <Route path="/o/:orgSlug" element={<LegacyORedirectToTenant />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/facilities" element={<AdminFacilities />} />
          <Route path="/admin/devices" element={<AdminDevices />} />
          <Route path="/admin/org-settings" element={<AdminOrgSettings />} />
          <Route path="/admin/platform/orgs" element={<AdminPlatformOrgs />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
