import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { clearAuthSession } from '../lib/authSession';

function apiUrl(path) {
  if (import.meta.env.DEV && import.meta.env.VITE_API_BASE) {
    return `${import.meta.env.VITE_API_BASE.replace(/\/$/, '')}${path}`;
  }
  return path;
}

function getToken() {
  return sessionStorage.getItem('accessToken') || '';
}

export default function AdminFacilities() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [address, setAddress] = useState('');

  async function load() {
    const token = getToken();
    if (!token) {
      nav('/admin/login');
      return;
    }
    setErr('');
    const res = await fetch(apiUrl('/api/admin/facilities'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!res.ok) {
      setErr(j.msg || '読み込みに失敗しました');
      return;
    }
    setItems(j.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addOne(e) {
    e.preventDefault();
    const token = getToken();
    setErr('');
    const body = {
      facilityId: Number(facilityId),
      name: name.trim(),
      sortOrder: Number(sortOrder) || 0,
      address: address.trim() || undefined,
    };
    const res = await fetch(apiUrl('/api/admin/facilities'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.msg || '登録に失敗しました');
      return;
    }
    setFacilityId('');
    setName('');
    setSortOrder('0');
    setAddress('');
    load();
  }

  async function toggleDisabled(row) {
    const token = getToken();
    setErr('');
    const res = await fetch(apiUrl(`/api/admin/facilities/${row.facilityId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ disabled: !Boolean(row.disabled) }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.msg || '更新に失敗しました');
      return;
    }
    load();
  }

  return (
    <AdminLayout
      width="wide"
      title="場所（監視地点）"
      description={
        <>
          登録した場所が監視ダッシュボードの<strong>カード名と並び順</strong>の基準になります。登録後は
          <Link to="/admin/devices" className="text-sky-700 font-semibold underline underline-offset-2 mx-0.5">
            デバイス紐付け
          </Link>
          で deviceId を結び付けてください。
        </>
      }
      headerActions={
        <>
          <Link to="/admin" className="btn-admin-toolbar-ghost">
            メニュー
          </Link>
          <Link to="/admin/devices" className="btn-admin-toolbar-ghost hidden sm:inline-flex">
            デバイス
          </Link>
        </>
      }
    >
      {err ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{err}</p>
      ) : null}

      <div className="surface-card p-5 space-y-4 max-w-3xl">
        <h2 className="admin-card-section-title">新しい場所を登録</h2>
        <form onSubmit={addOne} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="fac-id" className="block text-xs font-semibold text-slate-600 mb-1">
              場所 ID（数値）
            </label>
            <input
              id="fac-id"
              required
              placeholder="例: 1"
              className="input-field"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="fac-name" className="block text-xs font-semibold text-slate-600 mb-1">
              名前
            </label>
            <input
              id="fac-name"
              required
              placeholder="例: 北里小学校グランド"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="fac-sort" className="block text-xs font-semibold text-slate-600 mb-1">
              表示順
            </label>
            <input
              id="fac-sort"
              placeholder="0"
              className="input-field"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="fac-addr" className="block text-xs font-semibold text-slate-600 mb-1">
              住所（任意）
            </label>
            <input
              id="fac-addr"
              placeholder="例: 東京都港区..."
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-1">
            <button type="submit" className="btn-primary-solid px-6">
              登録
            </button>
          </div>
        </form>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-sm font-bold text-slate-900">登録済みの場所一覧</h2>
          <p className="text-xs text-slate-500 mt-0.5">無効にした場所は監視画面に出ません</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50/90 text-left text-xs text-slate-600 font-medium">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">名前</th>
              <th className="p-2">順</th>
              <th className="p-2">住所</th>
              <th className="p-2">無効</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.facilityId} className="border-t">
                <td className="p-2 font-mono">{row.facilityId}</td>
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.sortOrder ?? 0}</td>
                <td className="p-2 text-xs text-gray-600 max-w-[200px] truncate" title={row.address}>
                  {row.address || '—'}
                </td>
                <td className="p-2">{row.disabled ? 'yes' : ''}</td>
                <td className="p-2">
                  <button
                    type="button"
                    className="text-xs text-blue-700 underline"
                    onClick={() => toggleDisabled(row)}
                  >
                    {row.disabled ? '有効化' : '無効化'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
