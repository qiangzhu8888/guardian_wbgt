import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeFullscreenControls from '../components/ThemeFullscreenControls';
import { adminApiFetch, getAuthUser, requestAdminLogout } from '../lib/authSession';
import { registerWebPushWithServer } from '../lib/firebaseMessagingRegister';
import { monitorHomePath } from '../lib/orgRoute';
import { APP_DISPLAY_NAME, DEFAULT_APP_LOGO_URL, PRODUCTION_COMPANY_NAME } from '../lib/appBranding';
import { getAppReleaseVersion } from '../lib/appRelease';
import { ADMIN_LOGIN_PATH, MANUAL_PATH } from '../lib/productLandingCta';

const LEVEL_OPTIONS = /** @type {const} */ (['危険', '厳重警戒', '警戒', '注意']);

function userFacingError(code) {
  switch (code) {
    case 'missing_vapid':
      return 'VITE_FIREBASE_VAPID_KEY が設定されていません。Firebase Console で Web の公開鍵を発行してください。';
    case 'missing_firebase_config':
      return 'Firebase Web の構成（VITE_FIREBASE_*）が不完全です。';
    case 'messaging_unsupported':
      return 'このブラウザは Firebase メッセージングに対応していません。Chrome / Edge を推奨します。';
    case 'permission_denied':
      return 'ブラウザの通知許可が得られませんでした。サイト設定から通知を許可してください。';
    case 'unsupported':
      return 'ブラウザ通知 API がサポートされていません。';
    case 'server_register_failed':
      return 'サーバーへのトークン登録に失敗しました。ログイン状態を確認してください。';
    case 'get_token_failed':
      return 'Firebase からトークンを取得できませんでした（サービスワーカー競合の可能性）。';
    default:
      return '通知のセットアップに失敗しました。時間をおいて再度お試しください。';
  }
}

/** ログイン済みユーザー向けブラウザ通知（FCM）。viewer / admin 共通で利用できます。 */
export default function NotificationSettingsPage() {
  const nav = useNavigate();
  const appVersion = getAppReleaseVersion();
  const authUser = getAuthUser();
  const monitorPath = useMemo(() => monitorHomePath(authUser?.orgSlug), [authUser?.orgSlug]);

  const [booting, setBooting] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [regsBusy, setRegsBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [enabled, setEnabled] = useState(false);
  const [minLevel, setMinLevel] = useState('厳重警戒');
  const [registeredCount, setRegisteredCount] = useState(0);

  const load = useCallback(async () => {
    setErr('');
    const res = await adminApiFetch('/api/me/notification-settings');
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr('設定の取得に失敗しました。');
      return;
    }
    if (j.prefs) {
      setEnabled(Boolean(j.prefs.enabled));
      if (typeof j.prefs.minLevelForPush === 'string') setMinLevel(j.prefs.minLevelForPush);
    }
    if (typeof j.registeredDeviceCount === 'number') setRegisteredCount(j.registeredDeviceCount);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      nav(ADMIN_LOGIN_PATH, { replace: true });
      return;
    }
    void load().finally(() => setBooting(false));
  }, [load, nav]);

  async function onToggleEnabled(next) {
    setSaveBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await adminApiFetch('/api/me/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        setErr('保存に失敗しました。');
        return;
      }
      setEnabled(next);
      setMsg(next ? 'アラートをオンにしました。' : 'アラートをオフにしました。');
    } finally {
      setSaveBusy(false);
    }
  }

  async function onSaveLevel() {
    setSaveBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await adminApiFetch('/api/me/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minLevelForPush: minLevel }),
      });
      if (!res.ok) {
        setErr('保存に失敗しました。');
        return;
      }
      setMsg('通知の発火レベルを保存しました。');
    } finally {
      setSaveBusy(false);
    }
  }

  async function onRegisterPush() {
    setRegsBusy(true);
    setErr('');
    setMsg('');
    try {
      const result = await registerWebPushWithServer(adminApiFetch);
      if (!result.ok) {
        setErr(userFacingError(result.error || ''));
        return;
      }
      setMsg('この端末を通知先として登録しました。');
      await load();
    } finally {
      setRegsBusy(false);
    }
  }

  async function onTest() {
    setTestBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await adminApiFetch('/api/me/notifications/test', { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof j.msg === 'string' && j.msg ? j.msg : 'テスト送信に失敗しました。');
        return;
      }
      setMsg('テスト通知を送信しました。表示されない場合はブラウザの通知設定を確認してください。');
    } finally {
      setTestBusy(false);
    }
  }

  async function handleLogout() {
    await requestAdminLogout();
    nav(ADMIN_LOGIN_PATH, { replace: true });
  }

  if (booting) {
    return (
      <div className="min-h-screen app-admin-bg flex items-center justify-center text-slate-600 dark:text-slate-300">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="min-h-screen app-admin-bg flex flex-col">
      <header className="admin-shell-header">
        <div className="admin-shell-header-inner">
          <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
            <Link to="/" className="admin-shell-brand" title="製品案内へ">
              <img
                src={DEFAULT_APP_LOGO_URL}
                alt=""
                width={120}
                height={32}
                className="h-8 w-auto max-w-[120px] object-contain shrink-0 rounded opacity-95"
              />
              <span className="admin-shell-brand-text truncate">{APP_DISPLAY_NAME}</span>
            </Link>
            {appVersion ? (
              <span className="shrink-0 tabular-nums rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-100/90">
                v{appVersion}
              </span>
            ) : null}
            {authUser?.role ? (
              <span className="admin-role-badge-header admin-role-badge-header-muted shrink-0 hidden sm:inline-flex">
                {authUser.role}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            <ThemeFullscreenControls variant="admin" />
            <Link to={MANUAL_PATH} className="btn-admin-toolbar-ghost hidden sm:inline-flex">
              マニュアル
            </Link>
            {authUser?.role === 'viewer' ? null : (
              <Link to="/admin" className="btn-admin-toolbar-ghost">
                管理メニュー
              </Link>
            )}
            <Link to={monitorPath} className="btn-admin-toolbar">
              監視画面を開く
            </Link>
            <button type="button" onClick={() => void handleLogout()} className="btn-admin-logout">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">ブラウザ通知・アラート</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            ログイン済みユーザー向けです。Firestore に登録した FCM トークン経由で、組織内の<strong>監視データ（BUILDICS）</strong>から推定される WBGT
            が運用下限を上回った場合にプッシュされます（およそ 15 分間隔のバッチ）。
          </p>
          {authUser?.role === 'viewer' ? (
            <p className="mt-3 text-xs text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/70 rounded-xl px-3 py-2">
              Viewer アカウントでは施設・デバイス設定は変更できませんが、通知のオン／オフや強度のみここから設定できます。
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              詳細データはすべて Cloud Functions と Firebase Cloud Messaging が仲介します。業務規程に応じて範囲を限定してください。
            </p>
          )}
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-[12rem]">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">アラート配信を有効にする</span>
              <p className="text-[11px] text-slate-500 mt-1">オフ時は自動プッシュのみ停止します。</p>
            </div>
            <label className="inline-flex items-center gap-3 cursor-pointer shrink-0">
              <span className="text-sm font-medium">{enabled ? 'オン' : 'オフ'}</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-400 accent-sky-600"
                checked={enabled}
                disabled={saveBusy || regsBusy || testBusy}
                onChange={(e) => void onToggleEnabled(e.target.checked)}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">自動通知の開始レベル</span>
            <p className="text-[11px] text-slate-500 mt-1 mb-2 leading-relaxed">
              環境省の区分に合わせ、指定したランクより暑さがひどくなったら通知します。「厳重警戒」を選ぶと注意・ほぼ安全では鳴らしません。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="input-field inline-block max-w-xs"
                value={minLevel}
                disabled={saveBusy || regsBusy}
                onChange={(e) => setMinLevel(e.target.value)}
              >
                {LEVEL_OPTIONS.map((x) => (
                  <option key={x} value={x}>
                    {x} 〜
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={saveBusy}
                className="btn-primary-solid px-4 py-2 text-sm"
                onClick={() => void onSaveLevel()}
              >
                レベルを保存
              </button>
            </div>
          </label>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">この端末を通知先として登録</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              PWA でホームに追加済みでも、明示的な許可とトークンの登録が必要です。
              複数ブラウザを使用する場合はそれぞれで登録してください（最大 10 件まで）。現在の登録数:{' '}
              <strong className="tabular-nums">{registeredCount}</strong>
            </p>
            <button type="button" className="btn-primary-solid px-4 py-2 text-sm disabled:opacity-50" disabled={regsBusy || testBusy} onClick={() => void onRegisterPush()}>
              {regsBusy ? '登録処理中…' : 'ブラウザ通知を許可して登録'}
            </button>

            <button
              type="button"
              className="btn-secondary-outline px-4 py-2 text-sm ml-2 disabled:opacity-50"
              disabled={testBusy || registeredCount === 0}
              onClick={() => void onTest()}
            >
              {testBusy ? '送信中…' : 'テスト通知を送信'}
            </button>
          </div>
        </div>

        {msg ? (
          <div className="rounded-xl border border-green-100 bg-green-50 text-green-900 dark:bg-green-950/35 dark:border-green-900/70 dark:text-green-50 px-3 py-2 text-sm">
            {msg}
          </div>
        ) : null}
        {err ? (
          <div className="rounded-xl border border-red-100 bg-red-50 text-red-900 dark:bg-red-950/40 dark:border-red-900/70 dark:text-red-100 px-3 py-2 text-sm" role="alert">
            {err}
          </div>
        ) : null}
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-3 px-4 text-center text-[10px] text-slate-500 shrink-0">
        制作・開発：{PRODUCTION_COMPANY_NAME}
      </footer>
    </div>
  );
}
