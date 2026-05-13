import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import PwaInstallBanner from './components/PwaInstallBanner';
import HomePage from './pages/HomePage';
import ProductLandingPage from './pages/ProductLandingPage';
import ChangelogPage from './pages/ChangelogPage';
import AdminManualPage from './pages/AdminManualPage';
import AdminLogin from './pages/AdminLogin';
import AdminHome from './pages/AdminHome';
import AdminDevices from './pages/AdminDevices';
import AdminFacilities from './pages/AdminFacilities';
import AdminOrgSettings from './pages/AdminOrgSettings';
import AdminPlatformOrgs from './pages/AdminPlatformOrgs';
import { defaultOrgSlug, monitorHomePath } from './lib/orgRoute';
import { applyColorScheme } from './lib/themeInit';

function LegacyORedirectToTenant() {
  const { orgSlug } = useParams();
  return <Navigate to={monitorHomePath(orgSlug)} replace />;
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
  const defaultPath = `/tenant/${encodeURIComponent(defaultOrgSlug())}`;
  return (
    <BrowserRouter>
      <SystemColorSchemeSync />
      <PwaInstallGate />
      <Routes>
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route path="/product" element={<ProductLandingPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/manual" element={<AdminManualPage />} />
        <Route path="/tenant/:orgSlug" element={<HomePage />} />
        <Route path="/o/:orgSlug" element={<LegacyORedirectToTenant />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/facilities" element={<AdminFacilities />} />
        <Route path="/admin/devices" element={<AdminDevices />} />
        <Route path="/admin/org-settings" element={<AdminOrgSettings />} />
        <Route path="/admin/platform/orgs" element={<AdminPlatformOrgs />} />
      </Routes>
    </BrowserRouter>
  );
}
