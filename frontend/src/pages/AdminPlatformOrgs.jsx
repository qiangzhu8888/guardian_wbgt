import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { monitorHomePath } from '../lib/orgRoute';
import {
  createPlatformOrg,
  createPlatformUser,
  fetchPlatformOrgs,
} from '../lib/publicApi';

function getToken() {
  return sessionStorage.getItem('accessToken') || '';
}

export default function AdminPlatformOrgs() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [orgId, setOrgId] = useState('');
  const [slug, setSlug] = useState('');
  const [orgName, setOrgName] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userOrgId, setUserOrgId] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [savingUser, setSavingUser] = useState(false);

  async function load() {
    const token = getToken();
    if (!token) {
      nav('/admin/login');
      return;
    }
    setErr('');
    setLoading(true);
    const j = await fetchPlatformOrgs(token);
    setLoading(false);
    if (j._status === 401 || j._status === 403) {
      if (j._status === 403) {
        setErr('この画面はプラットフォーム管理者（superadmin）のみ利用できます。');
      } else {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('authUser');
        nav('/admin/login');
      }
      return;
    }
    if (!j._ok || !Array.isArray(j.data)) {
      setErr(typeof j.msg === 'string' ? j.msg : '一覧の取得に失敗しました');
      return;
    }
    setItems(j.data);
    if (!userOrgId && j.data.length) {
      setUserOrgId(String(j.data[0].orgId || ''));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreateOrg(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    setSavingOrg(true);
    const j = await createPlatformOrg(token, {
      orgId: orgId.trim(),
      slug: slug.trim().toLowerCase(),
      name: orgName.trim() || undefined,
    });
    setSavingOrg(false);
    if (j._status === 401) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('authUser');
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '組織の作成に失敗しました');
      return;
    }
    setOkMsg(`組織を作成しました（/o/${encodeURIComponent(slug.trim().toLowerCase())}）`);
    setOrgId('');
    setSlug('');
    setOrgName('');
    await load();
  }

  async function onCreateUser(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    setSavingUser(true);
    const j = await createPlatformUser(token, {
      email: userEmail.trim().toLowerCase(),
      password: userPassword,
      orgId: userOrgId.trim(),
      role: userRole,
    });
    setSavingUser(false);
    if (j._status === 401) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('authUser');
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : 'ユーザーの作成に失敗しました');
      return;
    }
    setOkMsg('ユーザーを作成しました');
    setUserEmail('');
    setUserPassword('');
  }

  if (!getToken()) {
    return null;
  }

  return (
    <div className="app-admin-bg p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-900/80 mb-1">Platform</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">組織の追加（プラットフォーム）</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            新しいテナント用の <code className="bg-slate-100 px-1.5 py-0.5 rounded-md text-xs font-mono">orgs</code>{' '}
            ドキュメントを作成します。続けて、その組織の管理者アカウントを作成できます。
          </p>
        </div>

        {err && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4" role="alert">
            {err}
          </p>
        )}
        {okMsg && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-4">
            {okMsg}
          </p>
        )}

        {loading ? (
          <div className="surface-card p-8 flex flex-col items-center gap-4">
            <div
              className="h-9 w-9 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"
              aria-hidden
            />
            <p className="text-sm text-slate-600">読み込み中…</p>
          </div>
        ) : (
          <>
            <div className="surface-card p-5 mb-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3">登録済み組織</h2>
              {items.length === 0 ? (
                <p className="text-xs text-slate-500">まだありません</p>
              ) : (
                <ul className="text-sm space-y-2">
                  {items.map((row) => (
                    <li
                      key={String(row.orgId)}
                      className="flex flex-wrap gap-2 items-center border-b border-slate-100 pb-2 last:border-0"
                    >
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md">{String(row.orgId)}</span>
                      <span className="text-xs text-slate-600">slug: /o/{String(row.slug ?? '')}</span>
                      {row.disabled ? <span className="text-xs text-amber-800 font-medium">無効</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={onCreateOrg} className="surface-card p-5 sm:p-6 mb-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">新規組織</h2>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">組織 ID（Firestore ドキュメント ID）</span>
                <input
                  type="text"
                  value={orgId}
                  onChange={(ev) => setOrgId(ev.target.value)}
                  className="input-field mt-1.5 font-mono text-[13px]"
                  placeholder="例: kitasato-2025"
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">URL スラッグ（公開URL /o/&lt;slug&gt;）</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(ev) => setSlug(ev.target.value)}
                  className="input-field mt-1.5 font-mono text-[13px]"
                  placeholder="例: kitasato"
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">表示名（任意）</span>
                <input
                  type="text"
                  value={orgName}
                  onChange={(ev) => setOrgName(ev.target.value)}
                  className="input-field mt-1.5"
                  maxLength={200}
                  autoComplete="off"
                />
              </label>
              <button type="submit" disabled={savingOrg} className="btn-primary-solid w-full py-3">
                {savingOrg ? '作成中…' : '組織を作成'}
              </button>
            </form>

            <form onSubmit={onCreateUser} className="surface-card p-5 sm:p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">組織の管理者ユーザーを作成</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                上記で作成した組織の <code className="bg-slate-100 px-1.5 rounded text-[11px]">orgId</code>{' '}
                を選び、別メールで管理者を追加できます。
              </p>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">所属組織 ID</span>
                <select
                  value={userOrgId}
                  onChange={(ev) => setUserOrgId(ev.target.value)}
                  className="input-field mt-1.5 font-mono text-[13px]"
                >
                  <option value="">選択してください</option>
                  {items.map((row) => (
                    <option key={String(row.orgId)} value={String(row.orgId)}>
                      {String(row.orgId)} ({String(row.slug)})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">メール</span>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(ev) => setUserEmail(ev.target.value)}
                  className="input-field mt-1.5"
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">パスワード（8文字以上）</span>
                <input
                  type="password"
                  value={userPassword}
                  onChange={(ev) => setUserPassword(ev.target.value)}
                  className="input-field mt-1.5"
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">ロール</span>
                <select
                  value={userRole}
                  onChange={(ev) => setUserRole(ev.target.value)}
                  className="input-field mt-1.5"
                >
                  <option value="admin">admin（施設・デバイス管理）</option>
                  <option value="viewer">viewer（閲覧のみ）</option>
                </select>
              </label>
              <button type="submit" disabled={savingUser} className="btn-secondary-outline w-full py-3">
                {savingUser ? '作成中…' : 'ユーザーを作成'}
              </button>
            </form>
          </>
        )}

        <p className="mt-10 text-center text-sm">
          <Link to="/admin" className="font-medium text-slate-600 hover:text-sky-800 underline underline-offset-4">
            ← 管理メニュー
          </Link>
        </p>
      </div>
    </div>
  );
}
