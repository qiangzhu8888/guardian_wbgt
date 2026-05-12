import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { monitorHomePath } from '../lib/orgRoute';
import {
  parseDeviceBulkCsv,
  DEVICE_BULK_CSV_TEMPLATE,
} from '../lib/parseDeviceBulkCsv';

function apiUrl(path) {
  if (import.meta.env.DEV && import.meta.env.VITE_API_BASE) {
    return `${import.meta.env.VITE_API_BASE.replace(/\/$/, '')}${path}`;
  }
  return path;
}

function getToken() {
  return sessionStorage.getItem('accessToken') || '';
}

const BULK_CHUNK = 100;

export default function AdminDevices() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [facilityId, setFacilityId] = useState('1');
  const [label, setLabel] = useState('');
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkTab, setBulkTab] = useState('csv');
  const [fileKey, setFileKey] = useState(0);

  async function loadFacilities() {
    const token = getToken();
    if (!token) return;
    const res = await fetch(apiUrl('/api/admin/facilities'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(j.data)) {
      const enabled = j.data.filter((f) => !f.disabled);
      setFacilities(
        enabled.sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.facilityId - b.facilityId,
        ),
      );
    }
  }

  async function load() {
    const token = getToken();
    if (!token) {
      nav('/admin/login');
      return;
    }
    setErr('');
    setLoading(true);
    const res = await fetch(apiUrl('/api/admin/devices'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
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
    loadFacilities();
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (facilities.length === 0) return;
    setFacilityId((prev) => {
      if (facilities.some((f) => String(f.facilityId) === String(prev))) return prev;
      return String(facilities[0].facilityId);
    });
  }, [facilities]);

  function facilityName(fid) {
    const f = facilities.find((x) => Number(x.facilityId) === Number(fid));
    return f?.name ?? '—';
  }

  async function patchDeviceFacility(did, newFacilityId) {
    const token = getToken();
    setErr('');
    const res = await fetch(apiUrl(`/api/admin/devices/${encodeURIComponent(did)}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ facilityId: Number(newFacilityId) }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.msg || '紐付けの更新に失敗しました');
      return;
    }
    load();
  }

  async function addOne(e) {
    e.preventDefault();
    const token = getToken();
    setErr('');
    setSuccessMsg('');
    setSaving(true);
    const res = await fetch(apiUrl('/api/admin/devices'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId,
        facilityId: Number(facilityId),
        label,
      }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(j.msg || '登録に失敗しました');
      return;
    }
    setDeviceId('');
    setLabel('');
    setSuccessMsg('1 件登録しました');
    load();
  }

  async function submitBulkChunks(itemsPayload) {
    const token = getToken();
    setErr('');
    setSuccessMsg('');
    setSaving(true);
    try {
      let total = 0;
      for (let i = 0; i < itemsPayload.length; i += BULK_CHUNK) {
        const slice = itemsPayload.slice(i, i + BULK_CHUNK);
        const res = await fetch(apiUrl('/api/admin/devices/bulk'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: slice }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          const batchStart = total;
          const detail =
            Array.isArray(j.errors) && j.errors.length
              ? j.errors
                  .map(
                    (e) =>
                      `一括 ${batchStart + (e.index ?? 0) + 1} 件目: ${e.msg}`,
                  )
                  .join(' · ')
              : j.msg || '一括登録に失敗しました';
          setErr(detail);
          setSaving(false);
          return;
        }
        total += slice.length;
      }
      setSuccessMsg(`${total} 件を一括登録しました（${Math.ceil(itemsPayload.length / BULK_CHUNK)} 回に分けて送信）`);
      setBulkJsonText('');
      setBulkCsvText('');
      setFileKey((k) => k + 1);
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } finally {
      setSaving(false);
    }
  }

  async function bulkAddFromCsv(e) {
    e.preventDefault();
    const parsed = parseDeviceBulkCsv(bulkCsvText, facilities);
    if (!parsed.ok) {
      setSuccessMsg('');
      const errs = parsed.errors.slice(0, 8);
      const more =
        parsed.errors.length > 8
          ? ` 他 ${parsed.errors.length - 8} 件`
          : '';
      setErr(
        errs.map((x) => (x.row ? `CSV ${x.row} 行目: ${x.msg}` : x.msg)).join(' / ') +
          more,
      );
      return;
    }
    await submitBulkChunks(parsed.items);
  }

  async function bulkAddJson(e) {
    e.preventDefault();
    let rows;
    try {
      rows = JSON.parse(bulkJsonText);
    } catch {
      setSuccessMsg('');
      setErr('JSON の形式が不正です');
      return;
    }
    if (!Array.isArray(rows)) {
      setSuccessMsg('');
      setErr('トップレベルは配列にしてください（例: [ {...}, {...} ]）');
      return;
    }
    await submitBulkChunks(rows);
  }

  function onCsvFile(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBulkCsvText(String(reader.result || ''));
      setErr('');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function downloadCsvTemplate() {
    const blob = new Blob([DEVICE_BULK_CSV_TEMPLATE], {
      type: 'text/csv;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'devices-import-sample.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function logout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    sessionStorage.removeItem('accessToken');
    nav('/admin/login');
  }

  const csvPreviewCount = (() => {
    const p = parseDeviceBulkCsv(bulkCsvText, facilities);
    return p.ok ? p.items.length : null;
  })();

  const activeCount = items.filter((r) => !r.disabled).length;

  return (
    <div className="app-admin-bg p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">デバイス台帳（管理者）</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
              BUILDICS の<strong>デバイス ID</strong>を、監視画面に表示する<strong>場所（監視地点）</strong>へ紐付けます。
              紐付けがないと、台帳に載っていても地点別の一覧に出ません。
            </p>
          </div>
          <div className="flex gap-3 sm:gap-4 text-sm flex-wrap shrink-0 items-center">
            <Link to="/admin" className="admin-header-link">
              管理トップ
            </Link>
            <Link to="/admin/facilities" className="admin-header-link">
              場所の追加
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

        <div className="surface-card p-5 mb-5 text-sm text-slate-700">
          <p className="font-bold text-slate-900 mb-2">使い方</p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed">
            <li>
              先に <Link to="/admin/facilities" className="text-sky-800 underline font-semibold">場所を登録</Link>
              しておきます。
            </li>
            <li>下のフォームまたは CSV でデバイスを追加します（既存 ID と重複するとエラーになります）。</li>
            <li>一覧の「紐付け場所」から、あとから別の場所へ変更できます。</li>
          </ol>
        </div>

      {(successMsg || err) && (
        <div className="mb-4 space-y-2">
          {successMsg && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {successMsg}
            </p>
          )}
          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
        </div>
      )}

      {facilities.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 text-sm text-amber-900">
          <p className="font-medium">場所がまだ登録されていません</p>
          <p className="mt-1 text-xs opacity-90">
            場所（監視地点）がないと、プルダウンで紐付けできません。CSV で場所 ID を数字で指定する場合は登録済みの ID に合わせてください。
          </p>
          <Link to="/admin/facilities" className="mt-2 inline-block text-sm font-semibold text-amber-800 underline">
            場所を追加する →
          </Link>
        </div>
      )}

      <div className="surface-card p-5 sm:p-6 mb-6">
        <h2 className="font-bold text-slate-900 text-sm mb-1">1 件ずつ登録</h2>
        <p className="text-xs text-slate-500 mb-4">
          デバイス ID は 6〜24 桁の数字です。表示名（ラベル）は任意です。
        </p>
        <form onSubmit={addOne} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="adm-dev-id" className="block text-xs font-semibold text-slate-600 mb-1">
              デバイス ID
            </label>
            <input
              id="adm-dev-id"
              placeholder="例: 350976658106130"
              className="input-field"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="adm-fac" className="block text-xs font-semibold text-slate-600 mb-1">
              紐付け場所
            </label>
            {facilities.length > 0 ? (
              <select
                id="adm-fac"
                className="input-field"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
              >
                {facilities.map((f) => (
                  <option key={f.facilityId} value={String(f.facilityId)}>
                    {f.name}（ID {f.facilityId}）
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="adm-fac"
                placeholder="場所 ID（数値）"
                className="input-field"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
              />
            )}
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="adm-label" className="block text-xs font-semibold text-slate-600 mb-1">
              表示名（任意）
            </label>
            <input
              id="adm-label"
              placeholder="例: 校門付近のセンサー"
              className="input-field"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary-solid px-6 disabled:opacity-50"
            >
              {saving ? '送信中…' : 'この内容で登録'}
            </button>
          </div>
        </form>
      </div>

      <div className="surface-card p-5 sm:p-6 mb-6">
        <h2 className="font-semibold text-slate-800 text-sm mb-1">一括登録</h2>
        <p className="text-xs text-slate-500 mb-3">
          サーバーは 1 回につき最大 {BULK_CHUNK} 件まで受け取ります。それ以上ある CSV は自動で分割して送ります。
        </p>

        <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg w-fit mb-3">
          <button
            type="button"
            onClick={() => {
              setBulkTab('csv');
              setErr('');
            }}
            className={`px-3 py-1.5 text-xs rounded-md font-medium ${
              bulkTab === 'csv' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            }`}
          >
            CSV（推奨）
          </button>
          <button
            type="button"
            onClick={() => {
              setBulkTab('json');
              setErr('');
            }}
            className={`px-3 py-1.5 text-xs rounded-md font-medium ${
              bulkTab === 'json' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
            }`}
          >
            JSON（上級者）
          </button>
        </div>

        {bulkTab === 'csv' ? (
          <form onSubmit={bulkAddFromCsv} className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                key={fileKey}
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onCsvFile}
                className="text-xs max-w-full"
              />
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="text-xs text-slate-700 underline"
              >
                サンプル CSV をダウンロード
              </button>
            </div>
            <p className="text-xs text-slate-600">
              1 行目はヘッダー。列の例:
              <span className="font-mono ml-1">deviceId, facilityId, label</span>
              または
              <span className="font-mono ml-1">デバイスID, 場所ID, ラベル</span>
              ／ <span className="font-mono">デバイスID, 場所名, ラベル</span>
              （場所名は上で読み込んだ場所マスタと完全一致）
            </p>
            <textarea
              className="input-field text-xs font-mono min-h-[8rem] py-2"
              value={bulkCsvText}
              placeholder="ファイルを選ぶか、ここに CSV を貼り付け"
              onChange={(e) => {
                setBulkCsvText(e.target.value);
                setErr('');
              }}
            />
            {csvPreviewCount != null && bulkCsvText.trim() && (
              <p className="text-xs text-emerald-700">プレビュー: 有効な行 {csvPreviewCount} 件</p>
            )}
            <button
              type="submit"
              disabled={saving || !bulkCsvText.trim()}
              className="btn-primary-solid disabled:opacity-50"
            >
              {saving ? '送信中…' : 'CSV を取り込んで一括登録'}
            </button>
          </form>
        ) : (
          <form onSubmit={bulkAddJson} className="space-y-2">
            <p className="text-xs text-slate-600">
              配列の JSON を貼り付けます。要素は{' '}
              <code className="bg-slate-100 px-1 rounded text-[11px]">deviceId</code>・
              <code className="bg-slate-100 px-1 rounded text-[11px]">facilityId</code>・
              <code className="bg-slate-100 px-1 rounded text-[11px]">label</code>（任意）です。
            </p>
            <p className="text-[11px] font-mono text-slate-500 break-all">
              [{`{"deviceId":"350976658106130","facilityId":1,"label":"校庭"}`}]
            </p>
            <textarea
              className="input-field text-xs font-mono min-h-[7rem] py-2"
              value={bulkJsonText}
              onChange={(e) => setBulkJsonText(e.target.value)}
            />
            <button
              type="submit"
              disabled={saving || !bulkJsonText.trim()}
              className="btn-secondary-outline disabled:opacity-50"
            >
              {saving ? '送信中…' : 'JSON を一括登録'}
            </button>
          </form>
        )}
      </div>

      <div className="surface-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-slate-800 text-sm">登録済み一覧</h2>
          <p className="text-xs text-slate-500">
            {loading ? '読み込み中…' : `${items.length} 件（有効 ${activeCount} / 無効 ${items.length - activeCount}）`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="p-2.5 font-medium">デバイス ID</th>
                <th className="p-2.5 font-medium min-w-[180px]">紐付け場所</th>
                <th className="p-2.5 font-medium">場所 ID</th>
                <th className="p-2.5 font-medium">表示名</th>
                <th className="p-2.5 font-medium">状態</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 text-sm">
                    まだデバイスがありません。上のフォームまたは CSV から追加してください。
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.deviceId} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="p-2.5 font-mono text-xs align-top">{row.deviceId}</td>
                    <td className="p-2 min-w-[160px] align-top">
                      {facilities.length > 0 && !row.disabled ? (
                        <select
                          className="input-field text-xs py-1.5 px-2"
                          value={String(row.facilityId)}
                          onChange={(e) => patchDeviceFacility(row.deviceId, e.target.value)}
                        >
                          {!facilities.some((f) => Number(f.facilityId) === Number(row.facilityId)) ? (
                            <option value={String(row.facilityId)}>
                              （マスタ外 ID {row.facilityId}）
                            </option>
                          ) : null}
                          {facilities.map((f) => (
                            <option key={f.facilityId} value={String(f.facilityId)}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-700 text-xs leading-relaxed">
                          {facilityName(row.facilityId)}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-xs text-slate-600 align-top">{row.facilityId}</td>
                    <td className="p-2.5 text-slate-800 align-top">{row.label || '—'}</td>
                    <td className="p-2.5 align-top">
                      {row.disabled ? (
                        <span className="text-amber-800 text-xs bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                          無効
                        </span>
                      ) : (
                        <span className="text-emerald-800 text-xs bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                          有効
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
