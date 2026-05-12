import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { monitorHomePath } from '../lib/orgRoute';
import { getAuthUser } from '../lib/authSession';

function getToken() {
  return sessionStorage.getItem('accessToken') || '';
}

export default function AdminHome() {
  const nav = useNavigate();

  useEffect(() => {
    if (!getToken()) {
      nav('/admin/login', { replace: true });
    }
  }, [nav]);

  if (!getToken()) {
    return null;
  }

  const authUser = getAuthUser();
  const isSuperadmin = authUser?.role === 'superadmin';

  return (
    <div className="app-admin-bg p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-800/80 mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">管理メニュー</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            まず<strong>場所（監視地点）</strong>を登録し、次に<strong>デバイス</strong>を場所に紐付けます。
          </p>
        </div>
        <ul className="space-y-3">
          {isSuperadmin ? (
            <li>
              <Link to="/admin/platform/orgs" className="admin-nav-card-emphasis">
                <span className="font-semibold text-amber-950">プラットフォーム：組織の追加</span>
                <p className="text-xs text-amber-900/90 mt-1.5 leading-relaxed">
                  新しいテナント（orgs）を作成し、必要ならその組織の管理者ユーザーを登録します。
                </p>
              </Link>
            </li>
          ) : null}
          <li>
            <Link to="/admin/org-settings" className="admin-nav-card">
              <span className="font-semibold text-slate-900">組織設定（公開画面・BUILDICS キー）</span>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                ダッシュボードのタイトル・テーマ・ロゴ、組織ごとの BUILDICS API キーを設定します。
              </p>
            </Link>
          </li>
          <li>
            <Link to="/admin/facilities" className="admin-nav-card">
              <span className="font-semibold text-slate-900">1. 場所を追加・編集</span>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">施設名・住所・並び順を登録します。</p>
            </Link>
          </li>
          <li>
            <Link to="/admin/devices" className="admin-nav-card">
              <span className="font-semibold text-slate-900">2. デバイスと紐付け</span>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                BUILDICS の deviceId を、登録した場所（facilityId）に結び付けます。
              </p>
            </Link>
          </li>
        </ul>
        <p className="mt-10 text-center text-sm">
          <Link to={monitorHomePath()} className="font-medium text-sky-700 hover:text-sky-900 underline underline-offset-4">
            ← 監視画面へ
          </Link>
        </p>
      </div>
    </div>
  );
}
