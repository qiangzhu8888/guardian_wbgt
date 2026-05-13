import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
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
    <AdminLayout
      width="narrow"
      title="管理メニュー"
      description={
        <>
          公開の監視ダッシュボードに表示する<strong>場所</strong>と<strong>デバイス紐付け</strong>をここで管理します。はじめての場合は
          <strong> 1 → 2 の順</strong>がおすすめです。
        </>
      }
    >
      <ul className="space-y-4">
        {isSuperadmin ? (
          <li>
            <Link to="/admin/platform/orgs" className="admin-nav-card-emphasis group block">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/90 text-lg shadow-sm border border-amber-600/30">
                  ⭐
                </span>
                <div>
                  <span className="font-bold text-amber-950 text-[15px] group-hover:underline underline-offset-2">
                    プラットフォーム：組織の追加
                  </span>
                  <p className="text-xs text-amber-900/90 mt-2 leading-relaxed">
                    新しいテナント（<code className="bg-white/60 px-1 rounded font-mono">orgs</code>
                    ）を作成し、必要ならその組織の管理者ユーザーを登録します。
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ) : null}
        <li>
          <Link to="/admin/org-settings" className="admin-nav-card-featured group block">
            <div className="flex items-start gap-4">
              <span className="admin-nav-card-step bg-slate-600">◎</span>
              <div>
                <span className="font-bold text-slate-900 text-[15px]">組織設定</span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  ダッシュボードのタイトル・テーマ・ロゴ、組織ごとの BUILDICS API キー（任意）を設定します。
                </p>
              </div>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/admin/facilities" className="admin-nav-card-featured group block">
            <div className="flex items-start gap-4">
              <span className="admin-nav-card-step">1</span>
              <div>
                <span className="font-bold text-slate-900 text-[15px]">場所を追加・編集</span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  監視地点の名前・住所・表示順を登録します。
                </p>
              </div>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/admin/devices" className="admin-nav-card-featured group block">
            <div className="flex items-start gap-4">
              <span className="admin-nav-card-step">2</span>
              <div>
                <span className="font-bold text-slate-900 text-[15px]">デバイスと紐付け</span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  BUILDICS のデバイス ID を、登録した場所に結び付けます。
                </p>
              </div>
            </div>
          </Link>
        </li>
      </ul>

      <div className="admin-callout-info mt-8">
        <p className="font-semibold text-sky-900 mb-1">ヒント</p>
        <p className="text-xs sm:text-sm text-sky-900/85">
          監視画面の見た目は「組織設定」から変更できます。データが表示されないときは、デバイスが正しい場所 ID に紐付いているか確認してください。
        </p>
      </div>

      <p className="text-center text-sm pt-4">
        <Link
          to={monitorHomePath(authUser?.orgSlug)}
          className="inline-flex items-center gap-1.5 font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-4"
        >
          ← 監視ダッシュボードを開く
        </Link>
      </p>
    </AdminLayout>
  );
}
