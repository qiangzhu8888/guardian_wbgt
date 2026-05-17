import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import FacilityLocationMapPicker from '../components/FacilityLocationMapPicker';
import { adminApiFetch, clearAuthSession } from '../lib/authSession';
import { FACILITY_PLACEMENT_OPTIONS } from '../lib/facilityPlacementType';
import { FACILITY_VENUE_CATEGORY_OPTIONS } from '../lib/facilityVenueCategory';
import { getLevelStyle, getWbgtColor } from '../monitoring/levelStyles';

/** @param {{ data: Record<string, unknown> }} props */
function LocationWeatherSnapshot({ data }) {
  const isJwa = data.wbgtSource === 'jwa';
  const ls = getLevelStyle(isJwa ? String(data.wbgtLevel || '') : '');
  const wbgtHex = isJwa && data.wbgtCelsius != null ? getWbgtColor(Number(data.wbgtCelsius)) : null;

  let forecastLabel = null;
  if (isJwa && data.wbgtForecastTime) {
    try {
      forecastLabel = new Date(String(data.wbgtForecastTime)).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      forecastLabel = String(data.wbgtForecastTime);
    }
  }

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-600/40 ${ls.cardBorder} ${ls.bg}`}
    >
      <div className="px-3 py-2 flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.08]">
        <span className={`h-2 w-2 rounded-full shrink-0 ${ls.summaryDot}`} aria-hidden />
        <p className={`text-[11px] font-semibold ${ls.summaryText}`}>
          {isJwa ? 'この位置の JWA 1km WBGT（参考）' : 'この位置付近（気温・湿度・参考）'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3 text-center">
        <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50/90 dark:from-amber-950/45 dark:to-orange-950/35 border border-amber-200/90 dark:border-amber-800/45 px-2 py-2.5 shadow-sm">
          <p className="text-[10px] font-semibold text-amber-800/90 dark:text-amber-200/95">気温</p>
          <p className="text-base font-bold text-amber-950 dark:text-amber-100 tabular-nums leading-tight mt-0.5">
            {data.tempCelsius != null ? `${data.tempCelsius}℃` : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-sky-50 to-cyan-50/90 dark:from-sky-950/45 dark:to-cyan-950/35 border border-sky-200/90 dark:border-sky-800/45 px-2 py-2.5 shadow-sm">
          <p className="text-[10px] font-semibold text-sky-800/90 dark:text-sky-200/95">湿度</p>
          <p className="text-base font-bold text-sky-950 dark:text-sky-100 tabular-nums leading-tight mt-0.5">
            {data.humidityPercent != null ? `${data.humidityPercent}%` : '—'}
          </p>
        </div>
        {isJwa ? (
          <div className={`rounded-lg border px-2 py-2.5 shadow-sm ${ls.summary}`}>
            <p className={`text-[10px] font-semibold ${ls.text}`}>WBGT</p>
            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight">日本気象協会 1km</p>
            <p
              className={`text-base font-bold tabular-nums leading-tight mt-0.5 ${wbgtHex ? '' : ls.text}`}
              style={wbgtHex ? { color: wbgtHex } : undefined}
            >
              {data.wbgtCelsius != null ? `${data.wbgtCelsius}℃` : '—'}
            </p>
            {data.wbgtLevel ? (
              <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ls.badge}`}>
                {String(data.wbgtLevel)}
              </span>
            ) : null}
            {forecastLabel ? (
              <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-1 tabular-nums">予測時刻 {forecastLabel}</p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200/90 dark:border-slate-600/60 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-2.5 shadow-sm">
            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">WBGT</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">日本気象協会 1km</p>
            <p className="text-base font-bold text-slate-400 dark:text-slate-500 tabular-nums leading-tight mt-0.5">—</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-1.5 leading-snug text-left">
              参照用の WBGT を表示できない場合があります。緯度・経度をご確認のうえ、しばらくしてから再度お試しください。
            </p>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-600/90 dark:text-slate-400/95 leading-relaxed px-3 pb-3">
        気温・湿度は Open-Meteo の現在値（参考）。
        {isJwa
          ? ' WBGT は日本気象協会（JWA）1km メッシュの時別予測から、いまに最も近い時刻の値です。センサー実測ではありません。'
          : ' WBGT は日本気象協会の予測データから表示します（気温・湿度からの推定はしません）。表示できないときは「—」です。'}
      </p>
    </div>
  );
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
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [placementType, setPlacementType] = useState('unknown');
  const [venueCategory, setVenueCategory] = useState('unknown');
  const [locCond, setLocCond] = useState(null);

  async function load() {
    setErr('');
    const res = await adminApiFetch('/api/admin/facilities');
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

  async function loadLocationConditions(latStr, lngStr) {
    const la = Number(latStr);
    const ln = Number(lngStr);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) {
      setLocCond(null);
      return;
    }
    setLocCond({ phase: 'loading' });
    const res = await adminApiFetch(
      `/api/admin/location-conditions?${new URLSearchParams({ lat: String(la), lon: String(ln) })}`,
    );
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!res.ok) {
      setLocCond({
        phase: 'error',
        msg: typeof j.msg === 'string' ? j.msg : '気象情報の取得に失敗しました',
      });
      return;
    }
    setLocCond({
      phase: 'ok',
      data: {
        tempCelsius: j.tempCelsius,
        humidityPercent: j.humidityPercent,
        weatherTime: j.weatherTime,
        wbgtCelsius: j.wbgtCelsius,
        wbgtLevel: j.wbgtLevel,
        wbgtSource: j.wbgtSource,
        wbgtForecastTime: j.wbgtForecastTime,
        weatherAttribution: j.weatherAttribution,
        wbgtAttribution: j.wbgtAttribution,
      },
    });
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

  async function geocodeFromAddress() {
    const q = address.trim();
    if (!q) {
      setErr('先に住所を入力してください');
      return;
    }
    setErr('');
    const res = await adminApiFetch(`/api/admin/geocode?${new URLSearchParams({ q })}`);
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!res.ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '緯度経度の取得に失敗しました');
      return;
    }
    if (j.lat != null && j.lng != null) {
      setLat(String(j.lat));
      setLng(String(j.lng));
      void loadLocationConditions(String(j.lat), String(j.lng));
    }
  }

  async function addOne(e) {
    e.preventDefault();
    setErr('');
    const latTrim = lat.trim();
    const lngTrim = lng.trim();
    const latNum = latTrim === '' ? NaN : Number(latTrim);
    const lngNum = lngTrim === '' ? NaN : Number(lngTrim);
    const body = {
      facilityId: Number(facilityId),
      name: name.trim(),
      sortOrder: Number(sortOrder) || 0,
      address: address.trim() || undefined,
      ...(latTrim !== '' && Number.isFinite(latNum) ? { lat: latNum } : {}),
      ...(lngTrim !== '' && Number.isFinite(lngNum) ? { lng: lngNum } : {}),
      placementType: placementType === 'unknown' ? undefined : placementType,
      venueCategory: venueCategory === 'unknown' ? undefined : venueCategory,
    };
    const res = await adminApiFetch('/api/admin/facilities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!res.ok) {
      setErr(j.msg || `登録に失敗しました（HTTP ${res.status}）`);
      return;
    }
    setFacilityId('');
    setName('');
    setSortOrder('0');
    setAddress('');
    setLat('');
    setLng('');
    setLocCond(null);
    setPlacementType('unknown');
    setVenueCategory('unknown');
    load();
  }

  async function patchVenueCategory(row, nextVenueCategory) {
    setErr('');
    const res = await adminApiFetch(`/api/admin/facilities/${row.facilityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ venueCategory: nextVenueCategory }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!res.ok) {
      setErr(j.msg || '場種の更新に失敗しました');
      return;
    }
    load();
  }

  async function patchPlacement(row, nextPlacementType) {
    setErr('');
    const res = await adminApiFetch(`/api/admin/facilities/${row.facilityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ placementType: nextPlacementType }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
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
    setErr('');
    setPhotoBusy(true);
    const res = await adminApiFetch(`/api/admin/facilities/${row.facilityId}/photo`, {
      method: 'POST',
      headers: {
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
    setErr('');
    setPhotoBusy(true);
    const res = await adminApiFetch(`/api/admin/facilities/${row.facilityId}/photo`, {
      method: 'DELETE',
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
    setErr('');
    const res = await adminApiFetch(`/api/admin/facilities/${row.facilityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ disabled: !Boolean(row.disabled) }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
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
    >
      {err ? (
        <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{err}</p>
      ) : null}

      <div className="surface-card p-5 space-y-4 max-w-3xl">
        <h2 className="admin-card-section-title">新しい場所を登録</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          場所 ID は<strong className="font-semibold text-slate-800">システム全体で一意の番号</strong>
          です（組織ごとに別番号ではありません）。一覧に無い番号でも、他組織や過去データと重複すると登録できません。
          <span className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span>
              組織内で未使用の候補:{' '}
              <span className="font-mono font-semibold text-slate-800 tabular-nums">{suggestedFacilityId}</span>
            </span>
            <button
              type="button"
              className="btn-secondary-outline w-full sm:w-auto px-4 py-2.5 text-xs font-semibold shadow-sm"
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
              autoComplete="street-address"
            />
            <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
              <button
                type="button"
                className="btn-primary-solid w-full sm:w-auto px-5 py-3 text-sm shadow-lg shadow-slate-900/20 dark:shadow-sky-950/40 ring-2 ring-sky-500/20 dark:ring-sky-400/25"
                onClick={() => void geocodeFromAddress()}
              >
                住所から緯度経度を取得
              </button>
              <span className="text-[11px] text-slate-500 sm:max-w-[min(100%,280px)] leading-snug">
                国土地理院の住所検索で国内の緯度・経度を入力欄に転記します。
              </span>
            </div>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-800">位置（任意・気象参照）</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              監視ダッシュボードの<strong className="font-medium text-slate-800">日本気象協会 1km WBGT</strong>
              および気象庁の熱中症警戒アラート参照に使います。住所の下のボタンまたは地図で
              <strong className="font-medium text-slate-800">緯度・経度</strong>を取得して登録してください。
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fac-lat" className="block text-xs font-semibold text-slate-600 mb-1">
                  緯度（lat）
                </label>
                <input
                  id="fac-lat"
                  inputMode="decimal"
                  placeholder="例: 35.6812"
                  className="input-field"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="fac-lng" className="block text-xs font-semibold text-slate-600 mb-1">
                  経度（lng）
                </label>
                <input
                  id="fac-lng"
                  inputMode="decimal"
                  placeholder="例: 139.7671"
                  className="input-field"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </div>
            </div>
            <FacilityLocationMapPicker
              latStr={lat}
              lngStr={lng}
              onPick={(la, ln) => {
                setLat(la);
                setLng(ln);
                void loadLocationConditions(la, ln);
              }}
            />
            {locCond?.phase === 'loading' ? (
              <p className="text-[11px] text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" aria-hidden />
                付近の気温・湿度と JWA 1km WBGT（参考）を取得中…
              </p>
            ) : null}
            {locCond?.phase === 'error' ? (
              <p className="text-[11px] text-amber-800 dark:text-amber-200">{locCond.msg}</p>
            ) : null}
            {locCond?.phase === 'ok' && locCond.data ? <LocationWeatherSnapshot data={locCond.data} /> : null}
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
            <table className="w-full text-sm min-w-[960px]">
              <thead className="bg-slate-50/90 text-left text-xs text-slate-600 font-medium">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">名前</th>
                  <th className="p-2 min-w-[140px]">設置区分</th>
                  <th className="p-2 min-w-[10rem]">場種</th>
                  <th className="p-2 min-w-[7.5rem]">設置写真</th>
                  <th className="p-2">順</th>
                  <th className="p-2">緯度・経度</th>
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
                  <td className="p-2 text-xs font-mono text-slate-600 whitespace-nowrap">
                    {Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng))
                      ? `${row.lat}, ${row.lng}`
                      : '—'}
                  </td>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t border-sky-100/90 dark:border-sky-900/60 bg-gradient-to-r from-sky-50/95 via-white to-slate-50/80 dark:from-sky-950/35 dark:via-slate-900/85 dark:to-slate-950/90">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">次のステップ（手順 2）</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              場所が登録できたら、<strong className="font-semibold text-slate-800 dark:text-slate-200">BUILDICS のデバイス ID</strong>
              を上記の<strong className="font-semibold text-slate-800 dark:text-slate-200">場所 ID</strong>
              に紐付けてください。監視画面のカードにセンサーデータが載ります。
            </p>
          </div>
          <Link
            to="/admin/devices"
            className="btn-primary-solid inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md shrink-0 w-full sm:w-auto text-center"
          >
            <span aria-hidden className="text-base leading-none">
              →
            </span>
            デバイス紐付け
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
