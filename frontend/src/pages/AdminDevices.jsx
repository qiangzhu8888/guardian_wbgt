import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import DeviceIdQrScannerModal from '../components/DeviceIdQrScannerModal';
import {
  parseDeviceBulkCsv,
  DEVICE_BULK_CSV_TEMPLATE,
} from '../lib/parseDeviceBulkCsv';
import { adminApiFetch, clearAuthSession } from '../lib/authSession';

const BULK_CHUNK = 100;
const BULK_PREVIEW_ROWS = 10;
const BULK_ERR_SHOW = 20;

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
  const [bulkBatch, setBulkBatch] = useState(null);
  const [csvDragOver, setCsvDragOver] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  async function loadFacilities() {
    const res = await adminApiFetch('/api/admin/facilities');
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
    setErr('');
    setLoading(true);
    const res = await adminApiFetch('/api/admin/devices');
    const j = await res.json().catch(() => ({}));
    setLoading(false);
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
    setErr('');
    const res = await adminApiFetch(`/api/admin/devices/${encodeURIComponent(did)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
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
    setErr('');
    setSuccessMsg('');
    setSaving(true);
    const res = await adminApiFetch('/api/admin/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    setErr('');
    setSuccessMsg('');
    setSaving(true);
    let total = 0;
    const nChunks = Math.max(1, Math.ceil(itemsPayload.length / BULK_CHUNK));
    setBulkBatch({ completed: 0, total: nChunks, rows: itemsPayload.length });
    try {
      for (let c = 0; c < nChunks; c += 1) {
        const slice = itemsPayload.slice(c * BULK_CHUNK, (c + 1) * BULK_CHUNK);
        setBulkBatch({ completed: c, total: nChunks, rows: itemsPayload.length });
        const res = await adminApiFetch('/api/admin/devices/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: slice }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          const batchStart = c * BULK_CHUNK;
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
          return;
        }
        total += slice.length;
        setBulkBatch({ completed: c + 1, total: nChunks, rows: itemsPayload.length });
      }
      setSuccessMsg(
        `${total} 件を一括登録しました（${nChunks} 回に分けて送信しました）`,
      );
      setBulkJsonText('');
      setBulkCsvText('');
      setFileKey((k) => k + 1);
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } finally {
      setBulkBatch(null);
      setSaving(false);
    }
  }

  async function bulkAddFromCsv(e) {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;
    if (!csvParsed || !csvParsed.ok) {
      setSuccessMsg('');
      setErr(
        csvParsed && !csvParsed.ok
          ? `チェック結果: ${csvParsed.errors.length} 件の修正が必要です（一覧は右／下のパネルを参照）`
          : 'CSV を入力してください',
      );
      return;
    }
    await submitBulkChunks(csvParsed.items);
  }

  async function bulkAddJson(e) {
    e.preventDefault();
    if (!bulkJsonText.trim()) return;
    if (!jsonParsed || !jsonParsed.ok) {
      setSuccessMsg('');
      setErr(jsonParsed?.err || 'JSON を確認してください');
      return;
    }
    await submitBulkChunks(jsonParsed.rows);
  }

  function readCsvFileToState(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBulkCsvText(String(reader.result || ''));
      setErr('');
      setSuccessMsg('');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function onCsvFile(ev) {
    readCsvFileToState(ev.target.files?.[0]);
  }

  function onCsvDragOver(ev) {
    bulkTab === 'csv' && ev.preventDefault();
  }

  function onCsvDragEnter(ev) {
    ev.preventDefault();
    if (bulkTab === 'csv') setCsvDragOver(true);
  }

  function onCsvDragLeave(ev) {
    ev.preventDefault();
    if (!ev.currentTarget.contains(ev.relatedTarget)) setCsvDragOver(false);
  }

  function onCsvDrop(ev) {
    ev.preventDefault();
    setCsvDragOver(false);
    const file = ev.dataTransfer.files?.[0];
    if (!file) return;
    const okName = /\.csv$/i.test(file.name);
    const okType = file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === '';
    if (!okName && !okType) {
      setSuccessMsg('');
      setErr('.csv ファイルをドロップするか、エクスプローラーから選択してください');
      return;
    }
    readCsvFileToState(file);
  }

  function clearBulkInput() {
    setBulkCsvText('');
    setBulkJsonText('');
    setFileKey((k) => k + 1);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErr('');
    setSuccessMsg('');
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

  const csvParsed = useMemo(() => {
    if (!bulkCsvText.trim()) return null;
    return parseDeviceBulkCsv(bulkCsvText, facilities);
  }, [bulkCsvText, facilities]);

  const jsonParsed = useMemo(() => {
    if (!bulkJsonText.trim()) return null;
    try {
      const rows = JSON.parse(bulkJsonText);
      if (!Array.isArray(rows)) {
        return { ok: false, err: 'トップレベルは配列にしてください（例: [ {...}, {...} ]）' };
      }
      return { ok: true, rows };
    } catch {
      return { ok: false, err: 'JSON の構文が不正です（カンマや括弧を確認）' };
    }
  }, [bulkJsonText]);

  const activeCount = items.filter((r) => !r.disabled).length;

  return (
    <AdminLayout
      width="wide"
      title="デバイス台帳"
      description={
        <>
          BUILDICS の<strong>デバイス ID</strong>を、監視画面に表示する<strong>場所（監視地点）</strong>へ紐付けます。紐付けがないと、台帳に載っていても地点別の一覧に出ません。
        </>
      }
    >
      <div className="surface-card p-5 mb-5 text-sm text-slate-700">
        <p className="admin-card-section-title mb-2">使い方</p>
        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed">
          <li>
            先に <Link to="/admin/facilities" className="text-sky-800 underline font-semibold">場所を登録</Link>
            しておきます。
          </li>
          <li>下のフォーム（QR スキャン可）または CSV でデバイスを追加します（既存 ID と重複するとエラーになります）。</li>
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
        <h2 className="admin-card-section-title mb-1">1 件ずつ登録</h2>
        <p className="text-xs text-slate-500 mb-4">
          デバイス ID は 6〜24 桁の数字です。カメラで QR を読み取ることもできます。表示名（ラベル）は任意です。
        </p>
        <form onSubmit={addOne} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="adm-dev-id" className="block text-xs font-semibold text-slate-600 mb-1">
              デバイス ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="adm-dev-id"
                placeholder="例: 350976658106130"
                className="input-field flex-1 min-w-0"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => {
                  setErr('');
                  setQrOpen(true);
                }}
                className="btn-secondary-outline shrink-0 px-3 py-2 text-xs font-semibold whitespace-nowrap"
              >
                QR スキャン
              </button>
            </div>
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

      <div className="surface-card p-5 sm:p-6 mb-6 border border-slate-100/80 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div>
            <h2 className="admin-card-section-title mb-1">一括登録</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Excel で編集した CSV の取り込みや、API 連携向けの JSON をまとめて送れます。登録前に件数と先頭行のプレビューが表示されます。
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              1 回 {BULK_CHUNK} 件まで
            </span>
            <span className="inline-flex items-center rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-900">
              超過は自動で分割送信
            </span>
          </div>
        </div>

        <div
          className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit mb-5"
          role="tablist"
          aria-label="一括登録の入力形式"
        >
          <button
            type="button"
            role="tab"
            aria-selected={bulkTab === 'csv'}
            onClick={() => {
              setBulkTab('csv');
              setErr('');
              setCsvDragOver(false);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs rounded-lg font-semibold transition-colors ${
              bulkTab === 'csv'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CSV
            <span className="hidden sm:inline text-slate-400 font-normal">（推奨）</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={bulkTab === 'json'}
            onClick={() => {
              setBulkTab('json');
              setErr('');
              setCsvDragOver(false);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs rounded-lg font-semibold transition-colors ${
              bulkTab === 'json'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            JSON
            <span className="hidden sm:inline text-slate-400 font-normal">（上級者）</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="min-w-0 space-y-4">
            {bulkTab === 'csv' ? (
              <form onSubmit={bulkAddFromCsv} className="space-y-4">
                <div
                  onDragEnter={onCsvDragEnter}
                  onDragOver={onCsvDragOver}
                  onDragLeave={onCsvDragLeave}
                  onDrop={onCsvDrop}
                  className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                    csvDragOver
                      ? 'border-sky-400 bg-sky-50/80'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800">CSV ファイルをドロップ</p>
                  <p className="text-xs text-slate-500 mt-1">または</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <input
                      key={fileKey}
                      ref={fileInputRef}
                      id="bulk-csv-file"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={onCsvFile}
                      className="sr-only"
                    />
                    <label
                      htmlFor="bulk-csv-file"
                      className="inline-flex cursor-pointer items-center rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      ファイルを選択
                    </label>
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="text-xs font-semibold text-sky-800 underline underline-offset-2"
                    >
                      サンプルをダウンロード
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="bulk-csv-text" className="block text-xs font-semibold text-slate-600 mb-1">
                    内容の確認・編集（UTF-8）
                  </label>
                  <textarea
                    id="bulk-csv-text"
                    className="input-field text-xs font-mono min-h-[12rem] py-2.5 leading-relaxed"
                    value={bulkCsvText}
                    placeholder="ここに CSV を貼り付けても構いません。1 行目は列名です。"
                    onChange={(e) => {
                      setBulkCsvText(e.target.value);
                      setErr('');
                    }}
                  />
                </div>

                <details className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs text-slate-600">
                  <summary className="cursor-pointer font-semibold text-slate-700 select-none">列の指定のしかた</summary>
                  <ul className="mt-2 space-y-1 list-disc list-inside pl-0.5">
                    <li>
                      英語ヘッダー例:{' '}
                      <code className="bg-white px-1 rounded font-mono text-[11px]">deviceId, facilityId, label</code>
                    </li>
                    <li>
                      日本語ヘッダー例:{' '}
                      <code className="bg-white px-1 rounded font-mono text-[11px]">デバイスID, 場所ID, ラベル</code>{' '}
                      または{' '}
                      <code className="bg-white px-1 rounded font-mono text-[11px]">デバイスID, 場所名, ラベル</code>
                    </li>
                    <li>場所名は登録済みの「名前」と完全一致する必要があります。</li>
                  </ul>
                </details>

                {bulkBatch ? (
                  <div className="rounded-xl bg-slate-100 border border-slate-200/80 p-3 space-y-2">
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600">
                      <span>
                        {bulkBatch.rows} 件 · {bulkBatch.total} 回に分割して送信中
                      </span>
                      <span className="font-mono text-slate-700">
                        {Math.min(bulkBatch.completed + 1, bulkBatch.total)} / {bulkBatch.total} バッチ
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/90 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-[width] duration-300 ease-out"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(6, (bulkBatch.completed / bulkBatch.total) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={clearBulkInput}
                    disabled={saving || (!bulkCsvText.trim() && !bulkJsonText.trim())}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 py-2"
                  >
                    入力をクリア
                  </button>
                  <button
                    type="submit"
                    disabled={
                      saving || !bulkCsvText.trim() || (csvParsed !== null && !csvParsed.ok)
                    }
                    className="btn-primary-solid px-6 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {saving ? '送信中…' : 'この内容で一括登録'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={bulkAddJson} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  トップレベルが配列の JSON です。各要素に{' '}
                  <code className="bg-slate-100 px-1 rounded text-[11px]">deviceId</code>・
                  <code className="bg-slate-100 px-1 rounded text-[11px]">facilityId</code>・
                  <code className="bg-slate-100 px-1 rounded text-[11px]">label</code>（任意）
                </p>
                <textarea
                  id="bulk-json-text"
                  className="input-field text-xs font-mono min-h-[12rem] py-2.5"
                  value={bulkJsonText}
                  placeholder={`例: [\n  {"deviceId":"350976658106130","facilityId":1,"label":"校庭"}\n]`}
                  onChange={(e) => {
                    setBulkJsonText(e.target.value);
                    setErr('');
                  }}
                />

                {bulkBatch ? (
                  <div className="rounded-xl bg-slate-100 border border-slate-200/80 p-3 space-y-2">
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600">
                      <span>
                        {bulkBatch.rows} 件 · {bulkBatch.total} 回に分割して送信中
                      </span>
                      <span className="font-mono text-slate-700">
                        {Math.min(bulkBatch.completed + 1, bulkBatch.total)} / {bulkBatch.total} バッチ
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/90 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-[width] duration-300 ease-out"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(6, (bulkBatch.completed / bulkBatch.total) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={clearBulkInput}
                    disabled={saving || (!bulkCsvText.trim() && !bulkJsonText.trim())}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 py-2"
                  >
                    入力をクリア
                  </button>
                  <button
                    type="submit"
                    disabled={
                      saving || !bulkJsonText.trim() || (jsonParsed !== null && !jsonParsed.ok)
                    }
                    className="btn-secondary-outline px-6 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {saving ? '送信中…' : 'この内容で一括登録'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="min-w-0 lg:border-l border-slate-100 lg:pl-8 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">登録前チェック</h3>
            {bulkTab === 'csv' ? (
              !bulkCsvText.trim() ? (
                <p className="text-sm text-slate-500 py-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  CSV を貼り付けるかファイルを選ぶと、件数とプレビューがここに出ます。
                </p>
              ) : csvParsed?.ok ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                      取り込み可能 · {csvParsed.items.length} 件
                    </span>
                    {csvParsed.items.length > BULK_CHUNK ? (
                      <span className="text-xs text-slate-600">
                        送信は {Math.ceil(csvParsed.items.length / BULK_CHUNK)} 回に分かれます
                      </span>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                          <th className="p-2 font-medium">#</th>
                          <th className="p-2 font-medium">deviceId</th>
                          <th className="p-2 font-medium">facilityId</th>
                          <th className="p-2 font-medium">label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsed.items.slice(0, BULK_PREVIEW_ROWS).map((row, idx) => (
                          <tr key={`${row.deviceId}-${idx}`} className="border-t border-slate-100">
                            <td className="p-2 text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-mono text-slate-800">{row.deviceId}</td>
                            <td className="p-2 font-mono text-slate-700">{row.facilityId}</td>
                            <td className="p-2 text-slate-700 max-w-[120px] truncate" title={row.label}>
                              {row.label || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvParsed.items.length > BULK_PREVIEW_ROWS ? (
                      <p className="px-2 py-1.5 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">
                        他 {csvParsed.items.length - BULK_PREVIEW_ROWS} 件は省略しています
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-900">
                    修正が必要です（{csvParsed?.errors?.length ?? 0} 件）
                  </p>
                  <ul className="max-h-56 overflow-y-auto rounded-xl border border-amber-100 bg-amber-50/50 text-xs text-amber-950 divide-y divide-amber-100/90">
                    {(csvParsed?.errors ?? []).slice(0, BULK_ERR_SHOW).map((x, i) => (
                      <li key={i} className="px-3 py-2 leading-relaxed">
                        {x.row ? (
                          <span className="font-mono text-[11px] text-amber-800">行 {x.row}</span>
                        ) : null}{' '}
                        {x.msg}
                      </li>
                    ))}
                  </ul>
                  {(csvParsed?.errors?.length ?? 0) > BULK_ERR_SHOW ? (
                    <p className="text-[11px] text-slate-500">
                      残り {csvParsed.errors.length - BULK_ERR_SHOW} 件の指摘があります
                    </p>
                  ) : null}
                </div>
              )
            ) : !bulkJsonText.trim() ? (
              <p className="text-sm text-slate-500 py-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                JSON を貼り付けると、件数と構文チェック結果がここに出ます。
              </p>
            ) : jsonParsed?.ok ? (
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                  構文OK · {jsonParsed.rows.length} 件
                </span>
                {jsonParsed.rows.length > BULK_CHUNK ? (
                  <p className="text-xs text-slate-600">
                    送信は {Math.ceil(jsonParsed.rows.length / BULK_CHUNK)} 回に分かれます
                  </p>
                ) : null}
                <pre className="rounded-xl bg-slate-900 text-slate-100 p-3 text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(jsonParsed.rows.slice(0, 3), null, 2)}
                  {jsonParsed.rows.length > 3 ? '\n  …' : ''}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {jsonParsed?.err ?? '入力を確認してください'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">登録済み一覧</h2>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t border-sky-100/90 dark:border-sky-900/60 bg-gradient-to-r from-emerald-50/90 via-white to-slate-50/80 dark:from-emerald-950/30 dark:via-slate-900/85 dark:to-slate-950/90">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">監視地点（手順 1）</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              紐付け先の<strong className="font-semibold text-slate-800 dark:text-slate-200">場所 ID</strong>
              が足りない、または新しい地点を増やしたいときは、先に<strong className="font-semibold text-slate-800 dark:text-slate-200">場所を登録</strong>
              してください。登録済みの番号のみ、上の一覧で選べます。
            </p>
          </div>
          <Link
            to="/admin/facilities"
            className="btn-primary-solid inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md shrink-0 w-full sm:w-auto text-center"
          >
            <span aria-hidden className="text-base leading-none">
              →
            </span>
            場所を登録
          </Link>
        </div>
      </div>
      <DeviceIdQrScannerModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onDecoded={(id) => {
          setDeviceId(id);
          setErr('');
          queueMicrotask(() => document.getElementById('adm-dev-id')?.focus());
        }}
      />
    </AdminLayout>
  );
}
