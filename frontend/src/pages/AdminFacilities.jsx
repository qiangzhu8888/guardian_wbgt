import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { clearAuthSession } from '../lib/authSession';
import { FACILITY_PLACEMENT_OPTIONS } from '../lib/facilityPlacementType';
import { FACILITY_VENUE_CATEGORY_OPTIONS } from '../lib/facilityVenueCategory';

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
  const [photoBusy, setPhotoBusy] = useState(false);
  const pendingPhotoRowRef = useRef(null);
  const photoInputRef = useRef(null);
  const [facilityId, setFacilityId] = useState('');
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [address, setAddress] = useState('');
  const [placementType, setPlacementType] = useState('unknown');
  const [venueCategory, setVenueCategory] = useState('unknown');

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

  const suggestedFacilityId = useMemo(() => {
    let max = 0;
    for (const row of items) {
      const n = Number(row.facilityId);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return max + 1;
  }, [items]);

  async function addOne(e) {
    e.preventDefault();
    const token = getToken();
    setErr('');
    const body = {
      facilityId: Number(facilityId),
      name: name.trim(),
      sortOrder: Number(sortOrder) || 0,
      address: address.trim() || undefined,
      placementType: placementType === 'unknown' ? undefined : placementType,
      venueCategory: venueCategory === 'unknown' ? undefined : venueCategory,
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
      setErr(j.msg || `登録に失敗しました（HTTP ${res.status}）`);
      return;
    }
    setFacilityId('');
    setName('');
    setSortOrder('0');
    setAddress('');
    setPlacementType('unknown');
    setVenueCategory('unknown');
    load();
  }

  async function patchVenueCategory(row, nextVenueCategory) {
    const token = getToken();
    setErr('');
    const res = await fetch(apiUrl(`/api/admin/facilities/${row.facilityId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ venueCategory: nextVenueCategory }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.msg || '場種の更新に失敗しました');
      return;
    }
    load();
  }

  async function patchPlacement(row, nextPlacementType) {
    const token = getToken();
    setErr('');
    const res = await fetch(apiUrl(`/api/admin/facilities/${row.facilityId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ placementType: nextPlacementType }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.msg || '設置区分の更新に失敗しました');
      return;
    }
    load();
  }

  function openFacilityPhotoPicker(row) {
    pendingPhotoRowRef.current = row;
    photoInputRef.current?.click();
  }

  async function onFacilityPhotoFileChange(e) {
    const file = e.target.files?.[0];
    const row = pendingPhotoRowRef.current;
    pendingPhotoRowRef.current = null;
    e.target.value = '';
    if (!file || !row) return;
    const token = getToken();
    setErr('');
    setPhotoBusy(true);
    const res = await fetch(apiUrl(`/api/admin/facilities/${row.facilityId}/photo`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': file.type || 'image/jpeg',
      },
      body: file,
    });
    const j = await res.json().catch(() => ({}));
    setPhotoBusy(false);
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!res.ok) {
      setErr(j.msg || '設置写真の登録に失敗しました');
      return;
    }
    load();
  }

  async function removeFacilityPhoto(row) {
    if (!window.confirm('この場所の設置写真を削除しますか？')) return;
    const token = getToken();
    setErr('');
    setPhotoBusy(true);
    const res = await fetch(apiUrl(`/api/admin/facilities/${row.facilityId}/photo`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json().catch(() => ({}));
    setPhotoBusy(false);
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!res.ok) {
      setErr(j.msg || '設置写真の削除に失敗しました');
      return;
    }
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
          で deviceId を結び付けてください。設置写真は一覧から PNG / JPEG / WebP（5MB 以下）で登録できます。
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
        <p className="text-xs text-slate-600 leading-relaxed">
          場所 ID は<strong className="font-semibold text-slate-800">システム全体で一意の番号</strong>
          です（組織ごとに別番号ではありません）。一覧に無い番号でも、他組織や過去データと重複すると登録できません。
          <span className="block mt-1">
            組織内で未使用の候補:{' '}
            <span className="font-mono font-semibold text-slate-800">{suggestedFacilityId}</span>
            <button
              type="button"
              className="ml-2 text-sky-700 font-semibold underline underline-offset-2"
              onClick={() => setFacilityId(String(suggestedFacilityId))}
            >
              入力欄に入れる
            </button>
          </span>
        </p>
        <form onSubmit={addOne} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="fac-id" className="block text-xs font-semibold text-slate-600 mb-1">
              場所 ID（数値）
            </label>
            <input
              id="fac-id"
              required
              placeholder={`例: ${suggestedFacilityId}`}
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
            <label htmlFor="fac-placement" className="block text-xs font-semibold text-slate-600 mb-1">
              設置区分
            </label>
            <select
              id="fac-placement"
              className="input-field"
              value={placementType}
              onChange={(e) => setPlacementType(e.target.value)}
            >
              {FACILITY_PLACEMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              屋外・屋内など。この場所でセンサーが監視している環境を選びます。公開設定にも含まれ、将来的なモデル／AI の条件分岐に利用できます。
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="fac-venue" className="block text-xs font-semibold text-slate-600 mb-1">
              場種
            </label>
            <select
              id="fac-venue"
              className="input-field"
              value={venueCategory}
              onChange={(e) => setVenueCategory(e.target.value)}
            >
              {FACILITY_VENUE_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              学校・病院・工場など、施設や用地のタイプです。設置区分（屋内／屋外とは別）、AI や運用フィルター用のメタ情報として公開設定にも含まれます。
            </p>
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

      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        aria-hidden
        onChange={(ev) => void onFacilityPhotoFileChange(ev)}
      />

      <div className="surface-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-sm font-bold text-slate-900">登録済みの場所一覧</h2>
          <p className="text-xs text-slate-500 mt-0.5">無効にした場所は監視画面に出ません</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[840px]">
            <thead className="bg-slate-50/90 text-left text-xs text-slate-600 font-medium">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">名前</th>
                <th className="p-2 min-w-[140px]">設置区分</th>
                <th className="p-2 min-w-[10rem]">場種</th>
                <th className="p-2 min-w-[7.5rem]">設置写真</th>
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
                  <td className="p-2">
                    <select
                      className="input-field py-1.5 text-xs min-w-[7rem]"
                      value={
                        row.placementType === undefined || row.placementType === null ? 'unknown' : row.placementType
                      }
                      aria-label={`${row.name}の設置区分`}
                      onChange={(e) => void patchPlacement(row, e.target.value)}
                    >
                      {FACILITY_PLACEMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      className="input-field py-1.5 text-xs min-w-[9rem]"
                      value={
                        row.venueCategory === undefined || row.venueCategory === null ? 'unknown' : row.venueCategory
                      }
                      aria-label={`${row.name}の場種`}
                      onChange={(e) => void patchVenueCategory(row, e.target.value)}
                    >
                      {FACILITY_VENUE_CATEGORY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 align-top">
                    <div className="flex flex-col gap-1">
                      {row.installationPhotoUrl ? (
                        <img
                          src={row.installationPhotoUrl}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-slate-50"
                          onError={(ev) => {
                            ev.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">未登録</span>
                      )}
                      <button
                        type="button"
                        disabled={photoBusy}
                        className="text-xs text-sky-700 underline text-left disabled:opacity-40"
                        aria-label={`${row.name}の設置写真をアップロード`}
                        onClick={() => openFacilityPhotoPicker(row)}
                      >
                        アップロード
                      </button>
                      {row.installationPhotoUrl ? (
                        <button
                          type="button"
                          disabled={photoBusy}
                          className="text-xs text-red-700 underline text-left disabled:opacity-40"
                          onClick={() => removeFacilityPhoto(row)}
                        >
                          削除
                        </button>
                      ) : null}
                    </div>
                  </td>
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
      </div>
    </AdminLayout>
  );
}
