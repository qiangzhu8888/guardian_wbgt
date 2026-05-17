import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { monitorHomePath } from '../lib/orgRoute';
import { fetchAdminOrgSettings, patchAdminOrgSettings, uploadAdminOrgLogo } from '../lib/publicApi';
import { clearAuthSession, getAuthUser } from '../lib/authSession';
import {
  DASHBOARD_THEME_PRESETS,
  pickerHexFromTheme,
  normalizeDashboardHex,
} from '../lib/dashboardTheme';
import {
  ORG_POLLING_PRESETS,
  presetIdFromMs,
  msFromPollingForm,
} from '../lib/orgPollingSettings';

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
  const [pollingPresetId, setPollingPresetId] = useState('1m');
  const [pollingCustomMinutes, setPollingCustomMinutes] = useState(30);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileRef = useRef(/** @type {HTMLInputElement | null} */ (null));

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
      clearAuthSession();
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
    const savedPolling =
      typeof d.pollingIntervalMs === 'number' && Number.isFinite(d.pollingIntervalMs)
        ? d.pollingIntervalMs
        : null;
    const displayPollingMs = savedPolling ?? 60000;
    setPollingPresetId(presetIdFromMs(displayPollingMs));
    setPollingCustomMinutes(Math.max(1, Math.round(displayPollingMs / 60000)));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const th = themePrimary.trim();
    let themeToSend = '';
    if (th) {
      const n = normalizeDashboardHex(th);
      if (!n) {
        setErr('テーマ色は #RRGGBB 形式（例: #0EA5E9）で入力するか、「色をクリア」で空にしてください');
        return;
      }
      themeToSend = n;
    }

    setErr('');
    setOkMsg('');
    setSaving(true);
    const body = {
      dashboardTitle,
      dashboardSubtitle,
      themePrimary: themeToSend,
      logoUrl,
      pollingIntervalMs: msFromPollingForm({
        presetId: pollingPresetId,
        customMinutes: pollingCustomMinutes,
      }),
    };
    if (buildicsApiKey.trim()) {
      body.buildicsApiKey = buildicsApiKey.trim();
    }
    const j = await patchAdminOrgSettings(token, body);
    setSaving(false);
    if (j._status === 401 || j._status === 403) {
      clearAuthSession();
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

  async function onResetPollingInterval() {
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    setSaving(true);
    const j = await patchAdminOrgSettings(token, { pollingIntervalMs: '' });
    setSaving(false);
    if (j._status === 401 || j._status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '既定への復帰に失敗しました');
      return;
    }
    setOkMsg('自動更新間隔をサーバー既定に戻しました');
    await load();
  }

  async function onLogoFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setErr('PNG / JPEG / WebP / SVG のみアップロードできます');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErr('画像は 2MB 以下にしてください');
      return;
    }
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    setUploadingLogo(true);
    const j = await uploadAdminOrgLogo(token, file);
    setUploadingLogo(false);
    if (j._status === 401 || j._status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : 'アップロードに失敗しました');
      return;
    }
    const url = j.data && typeof j.data.logoUrl === 'string' ? j.data.logoUrl : '';
    if (url) {
      setLogoUrl(url);
      setOkMsg('ロゴをアップロードしました');
    }
  }

  async function onClearLogo() {
    if (!logoUrl) return;
    if (!window.confirm('監視画面のロゴを削除しますか？（ストレージ上の画像も削除します）')) {
      return;
    }
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    setSaving(true);
    const j = await patchAdminOrgSettings(token, { logoUrl: '' });
    setSaving(false);
    if (j._status === 401 || j._status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '削除に失敗しました');
      return;
    }
    setLogoUrl('');
    setOkMsg('ロゴを削除しました');
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
    <AdminLayout
      width="narrow"
      title="組織設定"
      description={
        <>
          監視画面（公開ダッシュボード）の<strong>タイトル・テーマ・ロゴ・自動更新間隔</strong>と、必要に応じて組織専用の{' '}
          <strong>BUILDICS API キー</strong>を設定します。
          {slugHint ? (
            <span className="block mt-3 text-xs text-slate-500">
              公開URL:{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded-md font-mono text-[11px]">/tenant/{slugHint}</code>
              <span className="text-slate-400 mx-1">·</span>
              Firestore の <code className="bg-slate-100 px-1 rounded text-[11px]">orgs</code> でスラッグ変更可
            </span>
          ) : null}
        </>
      }
    >
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

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-600 dark:bg-slate-900/40">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                自動更新間隔（監視ダッシュボード）
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                BUILDICS から現場データを読み込む間隔です。最短は 1 分です。「サーバー既定に戻す」で組織の上書きを解除し、公開設定の{' '}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[11px]">polling.intervalMs</code>{' '}
                に従います。
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ORG_POLLING_PRESETS.map((p) => (
                  <label key={p.id} className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="pollingPreset"
                      className="accent-sky-600"
                      checked={pollingPresetId === p.id}
                      onChange={() => setPollingPresetId(p.id)}
                    />
                    {p.label}
                  </label>
                ))}
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="pollingPreset"
                    className="accent-sky-600"
                    checked={pollingPresetId === 'custom'}
                    onChange={() => {
                      const prevMs = msFromPollingForm({
                        presetId: pollingPresetId,
                        customMinutes: pollingCustomMinutes,
                      });
                      setPollingPresetId('custom');
                      setPollingCustomMinutes(Math.max(1, Math.round(prevMs / 60000)));
                    }}
                  />
                  カスタム
                </label>
              </div>
              {pollingPresetId === 'custom' ? (
                <label className="block max-w-[12rem]">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">間隔（分・1〜1440）</span>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    step={1}
                    value={pollingCustomMinutes}
                    onChange={(ev) => {
                      const n = Number(ev.target.value);
                      setPollingCustomMinutes(Number.isFinite(n) ? n : 1);
                    }}
                    className="input-field mt-1.5 tabular-nums"
                    aria-label="カスタム更新間隔（分）"
                  />
                </label>
              ) : null}
              <button
                type="button"
                disabled={saving}
                className="text-xs font-medium text-sky-800 hover:underline underline-offset-2 disabled:opacity-50 dark:text-sky-300"
                onClick={onResetPollingInterval}
              >
                自動更新間隔をサーバー既定に戻す
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <span className="text-xs font-semibold text-slate-600">プレビュー</span>
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className="h-14 flex-1 min-w-[140px] max-w-[200px] rounded-lg border border-slate-200 shadow-inner"
                  style={{
                    backgroundColor:
                      themePrimary && /^#[0-9A-Fa-f]{6}$/.test(themePrimary.trim())
                        ? themePrimary.trim()
                        : '#0f172a',
                  }}
                  title="ヘッダー帯のイメージ"
                />
                <div className="flex items-center justify-center min-h-[3rem] min-w-[4rem] rounded-lg border border-dashed border-slate-200 bg-white px-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="max-h-12 w-auto max-w-[120px] object-contain" />
                  ) : (
                    <span className="text-[11px] text-slate-400">ロゴなし</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-600">テーマ色（アクセント・ヘッダー帯）</span>
              <p className="text-xs text-slate-500">
                未設定のときは監視画面のデフォルト配色です。下の「保存」で Firestore に反映されます。
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <span className="sr-only">カラーピッカー</span>
                  <input
                    type="color"
                    aria-label="テーマ色を選ぶ"
                    className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                    value={pickerHexFromTheme(themePrimary)}
                    onChange={(ev) => setThemePrimary(normalizeDashboardHex(ev.target.value))}
                  />
                  <span className="text-xs text-slate-600">スポイト</span>
                </label>
                <input
                  type="text"
                  value={themePrimary}
                  onChange={(ev) => setThemePrimary(ev.target.value)}
                  placeholder="例: #0EA5E9（空でデフォルト）"
                  className="input-field font-mono text-[13px] flex-1 min-w-[8rem]"
                  maxLength={7}
                  autoComplete="off"
                  aria-label="テーマ色を16進で入力"
                />
                <button
                  type="button"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
                  onClick={() => setThemePrimary('')}
                >
                  色をクリア
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {DASHBOARD_THEME_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    title={p.label}
                    onClick={() => setThemePrimary(p.value)}
                    className={`h-8 w-8 rounded-md border-2 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 ${
                      themePrimary.toUpperCase() === p.value ? 'border-sky-600 ring-1 ring-sky-500' : 'border-white'
                    }`}
                    style={{ backgroundColor: p.value }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-600">ロゴ画像</span>
              <p className="text-xs text-slate-500">PNG / JPEG / WebP / SVG、最大 2MB。Firebase Storage に保存され、監視画面からその URL で表示されます。</p>
              <input
                ref={logoFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={onLogoFile}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingLogo || saving}
                  className="btn-secondary-outline text-sm py-2 px-4 disabled:opacity-50"
                  onClick={() => logoFileRef.current?.click()}
                >
                  {uploadingLogo ? 'アップロード中…' : 'ファイルを選ぶ'}
                </button>
                {logoUrl ? (
                  <button
                    type="button"
                    disabled={uploadingLogo || saving}
                    className="text-sm font-medium text-amber-900 hover:underline underline-offset-2 disabled:opacity-50"
                    onClick={onClearLogo}
                  >
                    ロゴを削除
                  </button>
                ) : null}
              </div>
            </div>

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

        <p className="pt-6 text-center text-sm space-y-2 border-t border-slate-200/80">
          <Link to="/admin" className="block font-medium text-slate-600 hover:text-sky-800 underline underline-offset-4">
            ← 管理メニュー
          </Link>
          <Link
            to={monitorHomePath(slugHint || getAuthUser()?.orgSlug)}
            className="block font-medium text-slate-600 hover:text-sky-800 underline underline-offset-4"
          >
            ← 監視画面（公開）
          </Link>
        </p>
    </AdminLayout>
  );
}
