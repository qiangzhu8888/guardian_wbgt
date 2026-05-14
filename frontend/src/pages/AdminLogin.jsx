import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeFullscreenControls from '../components/ThemeFullscreenControls';
import { monitorHomePath } from '../lib/orgRoute';
import { APP_DISPLAY_NAME, DEFAULT_APP_LOGO_URL, PRODUCTION_COMPANY_NAME } from '../lib/appBranding';
import { adminApiUrl } from '../lib/publicApi';
import { PRIVACY_PATH, TERMS_PATH } from '../lib/productLandingCta';

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch(adminApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.msg || 'ログインに失敗しました');
        return;
      }
      if (j.accessToken) {
        sessionStorage.setItem('accessToken', j.accessToken);
      }
      if (j.user) {
        sessionStorage.setItem('authUser', JSON.stringify(j.user));
      }
      nav('/admin');
    } catch {
      setErr('通信に失敗しました');
    }
  }

  return (
    <div className="min-h-screen app-admin-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.12),transparent)] dark:opacity-60"
        aria-hidden
      />
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <ThemeFullscreenControls variant="surface" />
      </div>
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md surface-card p-8 sm:p-10 space-y-6 shadow-soft"
      >
        <div className="space-y-3 text-center sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <img
              src={DEFAULT_APP_LOGO_URL}
              alt=""
              width={160}
              height={42}
              className="h-10 sm:h-11 w-auto max-w-[200px] object-contain"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-sky-700/80 dark:text-sky-300/90 leading-snug">{APP_DISPLAY_NAME}</p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">コンソールへログイン</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">監視システムの施設・デバイスを管理します</p>
          </div>
        </div>
        {err && (
          <div
            className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 px-3 py-2.5 text-sm text-red-800 dark:text-red-200"
            role="alert"
          >
            {err}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pw" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              パスワード
            </label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary-solid w-full py-3 text-[15px]">
          ログイン
        </button>
        <p className="text-center text-sm">
          <Link
            to={monitorHomePath()}
            className="font-medium text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 underline underline-offset-4"
          >
            ← 監視画面へ
          </Link>
        </p>
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
          <Link to={TERMS_PATH} className="text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
            利用規約
          </Link>
          <span className="mx-1.5 text-slate-400" aria-hidden>
            ·
          </span>
          <Link to={PRIVACY_PATH} className="text-sky-700 dark:text-sky-400 hover:underline underline-offset-4">
            プライバシーポリシー
          </Link>
        </p>
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-2">
          制作・開発：{PRODUCTION_COMPANY_NAME}
        </p>
      </form>
    </div>
  );
}
