import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { monitorHomePath } from '../lib/orgRoute';
import FacilityLocationMap from '../components/FacilityLocationMap';
import { DEFAULT_TOKYO_LAT, DEFAULT_TOKYO_LNG } from '../lib/geoFormat';

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
  const [lat, setLat] = useState(DEFAULT_TOKYO_LAT);
  const [lng, setLng] = useState(DEFAULT_TOKYO_LNG);

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
      sessionStorage.removeItem('accessToken');
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
    if (lat.trim()) body.lat = Number(lat);
    if (lng.trim()) body.lng = Number(lng);
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
    setLat(DEFAULT_TOKYO_LAT);
    setLng(DEFAULT_TOKYO_LNG);
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

  async function logout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    sessionStorage.removeItem('accessToken');
    nav('/admin/login');
  }

  return (
    <div className="app-admin-bg p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">場所（監視地点）</h1>
          <div className="flex gap-3 sm:gap-4 text-sm flex-wrap items-center">
            <Link to="/admin" className="admin-header-link">
              管理トップ
            </Link>
            <Link to="/admin/devices" className="admin-header-link">
              デバイス紐付け
            </Link>
            <Link to={monitorHomePath()} className="admin-header-link">
              監視画面
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline underline-offset-4"
            >
              ログアウト
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-6 max-w-3xl leading-relaxed">
          ここで登録した「場所」が監視画面のカード名・並びの元になります。緯度・経度の<strong>初期値は東京（都庁付近）</strong>で、地図の青いピンでも確認できます。登録後、
          <Link to="/admin/devices" className="text-sky-800 font-medium underline underline-offset-2 mx-0.5">
            デバイス紐付け
          </Link>
          で各 deviceId を場所に結び付けてください。
        </p>

        {err && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">{err}</p>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="surface-card p-5 space-y-4">
            <h2 className="font-bold text-sm text-slate-900">場所を追加</h2>
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
              <div>
                <label htmlFor="fac-lat" className="block text-xs font-semibold text-slate-600 mb-1">
                  緯度（初期: 東京）
                </label>
                <input
                  id="fac-lat"
                  placeholder="地図をクリックでも入力可"
                  className="input-field"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div>
                <label htmlFor="fac-lng" className="block text-xs font-semibold text-slate-600 mb-1">
                  経度（初期: 東京）
                </label>
                <input
                  id="fac-lng"
                  placeholder="地図をクリックでも入力可"
                  className="input-field"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end pt-1">
                <button type="submit" className="btn-primary-solid px-6">
                  登録
                </button>
              </div>
            </form>
          </div>

        <div className="space-y-2 flex flex-col">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-semibold text-sm text-slate-800">地図（プレビュー）</h2>
            <span className="text-[10px] text-slate-500 leading-tight text-right">
              国土地理院
            </span>
          </div>
          <p className="text-xs text-slate-600">
            初期は<strong>東京（都庁付近）の緯度経度</strong>が入っており、青いピンで表示されます。地図を<strong>クリック</strong>すると、その位置に更新されます。灰色の点は登録済みの位置です。他地域にピンがある場合は範囲が広がります。
          </p>
          <FacilityLocationMap
            className="flex-1 min-h-[280px]"
            facilities={items}
            draftLat={lat}
            draftLng={lng}
            onPickLatLng={(la, ln) => {
              setLat(la);
              setLng(ln);
            }}
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/90 text-left text-xs text-slate-600 font-medium">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">名前</th>
              <th className="p-2">順</th>
              <th className="p-2">住所</th>
              <th className="p-2 whitespace-nowrap">緯度</th>
              <th className="p-2 whitespace-nowrap">経度</th>
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
                <td className="p-2 text-xs text-gray-600 max-w-[140px] truncate" title={row.address}>
                  {row.address || '—'}
                </td>
                <td className="p-2 text-xs font-mono text-slate-600">
                  {row.lat != null && row.lat !== '' ? row.lat : '—'}
                </td>
                <td className="p-2 text-xs font-mono text-slate-600">
                  {row.lng != null && row.lng !== '' ? row.lng : '—'}
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
      </div>
    </div>
  );
}
