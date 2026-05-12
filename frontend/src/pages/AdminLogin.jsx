import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { monitorHomePath } from '../lib/orgRoute';
import { adminApiUrl } from '../lib/publicApi';

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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.12),transparent)]"
        aria-hidden
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md surface-card p-8 sm:p-10 space-y-6 shadow-soft"
      >
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700/80">Admin</p>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">管理者ログイン</h1>
          <p className="text-sm text-slate-500">監視システムの施設・デバイスを管理します</p>
        </div>
        {err && (
          <div
            className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            {err}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5">
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
            <label htmlFor="pw" className="block text-xs font-semibold text-slate-600 mb-1.5">
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
            className="font-medium text-sky-700 hover:text-sky-900 underline underline-offset-4"
          >
            ← 監視画面へ
          </Link>
        </p>
      </form>
    </div>
  );
}
