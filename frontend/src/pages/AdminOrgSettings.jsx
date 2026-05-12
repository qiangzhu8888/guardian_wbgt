import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { monitorHomePath } from '../lib/orgRoute';
import { fetchAdminOrgSettings, patchAdminOrgSettings } from '../lib/publicApi';

function getToken() {
  return sessionStorage.getItem('accessToken') || '';
}

export default function AdminOrgSettings() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [dashboardSubtitle, setDashboardSubtitle] = useState('');
  const [themePrimary, setThemePrimary] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [buildicsApiKey, setBuildicsApiKey] = useState('');
  const [slugHint, setSlugHint] = useState('');
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [keyLast4, setKeyLast4] = useState(/** @type {string | null} */ (null));

  async function load() {
    const token = getToken();
    if (!token) {
      nav('/admin/login');
      return;
    }
    setErr('');
    setLoading(true);
    const j = await fetchAdminOrgSettings(token);
    setLoading(false);
    if (j._status === 401 || j._status === 403) {
      sessionStorage.removeItem('accessToken');
      nav('/admin/login');
      return;
    }
    if (!j._ok || !j.data) {
      setErr(typeof j.msg === 'string' ? j.msg : '読み込みに失敗しました');
      return;
    }
    const d = j.data;
    setSlugHint(typeof d.slug === 'string' ? d.slug : '');
    setDashboardTitle(d.dashboardTitle || '');
    setDashboardSubtitle(d.dashboardSubtitle || '');
    setThemePrimary(d.themePrimary || '');
    setLogoUrl(d.logoUrl || '');
    setKeyConfigured(!!d.buildicsApiKeyConfigured);
    setKeyLast4(d.buildicsApiKeyLast4 || null);
    setBuildicsApiKey('');
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    setSaving(true);
    const body = {
      dashboardTitle,
      dashboardSubtitle,
      themePrimary,
      logoUrl,
    };
    if (buildicsApiKey.trim()) {
      body.buildicsApiKey = buildicsApiKey.trim();
    }
    const j = await patchAdminOrgSettings(token, body);
    setSaving(false);
    if (j._status === 401 || j._status === 403) {
      sessionStorage.removeItem('accessToken');
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '保存に失敗しました');
      return;
    }
    setOkMsg('保存しました');
    setBuildicsApiKey('');
    await load();
  }

  async function onClearBuildicsKey() {
    const token = getToken();
    if (!token) return;
    if (!window.confirm('組織専用の BUILDICS API キーを削除し、環境変数のフォールバックに戻しますか？')) {
      return;
    }
    setErr('');
    setOkMsg('');
    setSaving(true);
    const j = await patchAdminOrgSettings(token, { buildicsApiKey: '' });
    setSaving(false);
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '削除に失敗しました');
      return;
    }
    setOkMsg('組織キーを削除しました');
    await load();
  }

  if (!getToken()) {
    return null;
  }

  return (
    <div className="app-admin-bg p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-800/80 mb-1">Settings</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">組織設定</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            監視画面（公開ダッシュボード）のタイトル・外観と、必要に応じて BUILDICS API キーを設定します。
            {slugHint ? (
              <span className="block mt-2 text-xs text-slate-500">
                公開URLスラッグ: <code className="bg-slate-100 px-1.5 py-0.5 rounded-md font-mono text-[11px]">{slugHint}</code>
                （Firestore の <code className="bg-slate-100 px-1.5 py-0.5 rounded-md font-mono text-[11px]">orgs</code>{' '}
                で変更）
              </span>
            ) : null}
          </p>
        </div>

        {loading ? (
          <div className="surface-card p-8 flex flex-col items-center gap-4">
            <div
              className="h-9 w-9 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"
              aria-hidden
            />
            <p className="text-sm text-slate-600">読み込み中…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="surface-card p-5 sm:p-6 space-y-5">
            {err && (
              <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">
                {err}
              </p>
            )}
            {okMsg && (
              <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                {okMsg}
              </p>
            )}

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">ダッシュボードタイトル</span>
              <input
                type="text"
                value={dashboardTitle}
                onChange={(ev) => setDashboardTitle(ev.target.value)}
                className="input-field mt-1.5"
                maxLength={120}
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">サブタイトル</span>
              <input
                type="text"
                value={dashboardSubtitle}
                onChange={(ev) => setDashboardSubtitle(ev.target.value)}
                className="input-field mt-1.5"
                maxLength={200}
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">テーマ色（#RRGGBB）</span>
              <input
                type="text"
                value={themePrimary}
                onChange={(ev) => setThemePrimary(ev.target.value)}
                placeholder="#000000"
                className="input-field mt-1.5 font-mono text-[13px]"
                maxLength={7}
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">ロゴ URL（HTTPS・許可ホストのみ）</span>
              <input
                type="url"
                value={logoUrl}
                onChange={(ev) => setLogoUrl(ev.target.value)}
                placeholder="https://storage.googleapis.com/..."
                className="input-field mt-1.5"
                maxLength={500}
                autoComplete="off"
              />
            </label>

            <div className="border-t border-slate-100 pt-5 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">BUILDICS API キー（組織専用）</span>
                {keyConfigured ? (
                  <p className="text-xs text-slate-500 mt-1">
                    現在設定済み{keyLast4 ? `（末尾 ****${keyLast4}）` : ''}。変更する場合のみ入力してください。
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">
                    未設定の場合はサーバーの環境変数 <code className="bg-slate-100 px-1.5 rounded text-[11px]">BUILDICS_API_KEY</code>{' '}
                    が使われます。
                  </p>
                )}
                <input
                  type="password"
                  value={buildicsApiKey}
                  onChange={(ev) => setBuildicsApiKey(ev.target.value)}
                  className="input-field mt-1.5"
                  autoComplete="off"
                  placeholder="新しいキーを入力"
                />
              </label>
              {keyConfigured ? (
                <button
                  type="button"
                  onClick={onClearBuildicsKey}
                  disabled={saving}
                  className="text-xs font-medium text-amber-900 hover:underline underline-offset-2 disabled:opacity-50"
                >
                  組織キーを削除（フォールバックに戻す）
                </button>
              ) : null}
            </div>

            <button type="submit" disabled={saving} className="btn-primary-solid w-full py-3">
              {saving ? '保存中…' : '保存'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm space-y-2">
          <Link to="/admin" className="block font-medium text-slate-600 hover:text-sky-800 underline underline-offset-4">
            ← 管理メニュー
          </Link>
          <Link to={monitorHomePath()} className="block font-medium text-slate-600 hover:text-sky-800 underline underline-offset-4">
            ← 監視画面
          </Link>
        </p>
      </div>
    </div>
  );
}
