import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import AdminHome from './pages/AdminHome';
import AdminDevices from './pages/AdminDevices';
import AdminFacilities from './pages/AdminFacilities';
import AdminOrgSettings from './pages/AdminOrgSettings';
import AdminPlatformOrgs from './pages/AdminPlatformOrgs';
import { defaultOrgSlug, monitorHomePath } from './lib/orgRoute';

function LegacyORedirectToTenant() {
  const { orgSlug } = useParams();
  return <Navigate to={monitorHomePath(orgSlug)} replace />;
}

export default function App() {
  const defaultPath = `/tenant/${encodeURIComponent(defaultOrgSlug())}`;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
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
