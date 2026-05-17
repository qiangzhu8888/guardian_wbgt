import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { monitorHomePath, publicOrgDashboardAbsoluteUrl } from '../lib/orgRoute';
import {
  createPlatformOrg,
  createPlatformUser,
  deletePlatformUser,
  fetchPlatformOrgs,
  fetchPlatformUsers,
  patchPlatformUser,
} from '../lib/publicApi';
import { clearAuthSession, getAuthUser } from '../lib/authSession';

function getToken() {
  return sessionStorage.getItem('accessToken') || '';
}

/** @param {unknown} ts */
function formatTs(ts) {
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return '—';
  try {
    return new Date(ts).toLocaleString('ja-JP');
  } catch {
    return '—';
  }
}

/** @param {Record<string, unknown>} row */
export function normalizeUserOrgIds(row) {
  /** @type {string[]} */
  const out = [];
  const pushUnique = (id) => {
    const s = String(id || '').trim();
    if (!s || out.includes(s)) return;
    out.push(s);
  };
  const raw = row.orgIds;
  if (Array.isArray(raw)) {
    for (const x of raw)
      pushUnique(typeof x === 'string' ? x : x?.orgId ?? x?.id ?? null);
  }
  pushUnique(row.orgId);
  return out;
}

/**
 * Firestore org doc ids are case-sensitive. User docs may contain legacy casing mismatches vs orgs/.
 * Align members to catalog keys so checkbox state and PATCH body match list rows.
 *
 * @param {string[]} ids
 * @param {Array<{ orgId?: string }>} catalogItems fetchPlatformOrgs data
 */
export function reconcileMembershipIdsWithCatalog(ids, catalogItems) {
  const list = Array.isArray(ids) ? ids : [];
  const cat = Array.isArray(catalogItems) ? catalogItems : [];
  const cleaned = [...new Set(list.map((id) => String(id ?? '').trim()).filter(Boolean))];
  /** @type {string[]} */
  const out = [];
  for (const id of cleaned) {
    const hit = cat.find((o) => String(o.orgId ?? '').toLowerCase() === id.toLowerCase());
    out.push(hit ? String(hit.orgId) : id);
  }
  return [...new Set(out)];
}

/** @param {Record<string, unknown>} row */
function formatUserOrgScopeCell(row) {
  const ids = normalizeUserOrgIds(row);
  if (!ids.length) return '—';
  if (ids.length === 1) return ids[0];
  const p = String(row.orgId || '').trim();
  if (p && ids.includes(p)) {
    return (
      <>
        <span className="font-mono">{p}</span>
        <span className="text-slate-500 font-normal">{` （他 ${ids.length - 1}）`}</span>
      </>
    );
  }
  return <span className="font-mono">{ids.join(', ')}</span>;
}
export default function AdminPlatformOrgs() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [users, setUsers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [orgId, setOrgId] = useState('');
  const [slug, setSlug] = useState('');
  const [orgName, setOrgName] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userOrgId, setUserOrgId] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [savingUser, setSavingUser] = useState(false);

  const [editOpenId, setEditOpenId] = useState(/** @type {string | null} */ (null));
  const [editEmail, setEditEmail] = useState('');
  const [editOrgId, setEditOrgId] = useState('');
  const [editRole, setEditRole] = useState('admin');
  const [editPassword, setEditPassword] = useState('');
  /** 編集時: admin/viewer のアクセス可能 orgId 一覧 */
  const [editMembershipIds, setEditMembershipIds] = useState(/** @type {string[]} */ ([]));
  const [editSaving, setEditSaving] = useState(false);

  const sessionUser = getAuthUser();

  async function load() {
    const token = getToken();
    if (!token) {
      nav('/admin/login');
      return;
    }
    setErr('');
    setLoading(true);
    const [j, ju] = await Promise.all([fetchPlatformOrgs(token), fetchPlatformUsers(token)]);
    setLoading(false);
    const authFail = j._status === 401 || ju._status === 401;
    const forbidden = j._status === 403 || ju._status === 403;
    if (forbidden) {
      setErr('この画面はプラットフォーム管理者（superadmin）のみ利用できます。');
      return;
    }
    if (authFail) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!j._ok || !Array.isArray(j.data)) {
      setErr(typeof j.msg === 'string' ? j.msg : '組織一覧の取得に失敗しました');
      return;
    }
    if (!ju._ok || !Array.isArray(ju.data)) {
      setErr(typeof ju.msg === 'string' ? ju.msg : 'ユーザー一覧の取得に失敗しました');
      return;
    }
    setItems(j.data);
    setUsers(ju.data);
    if (!userOrgId && j.data.length) {
      setUserOrgId(String(j.data[0].orgId || ''));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!editOpenId) return;
    setEditOrgId((cur) => {
      const c = String(cur || '').trim();
      const hit =
        editMembershipIds.find((m) => m === c) ??
        editMembershipIds.find((m) => m.toLowerCase() === c.toLowerCase()) ??
        null;
      if (hit != null) return hit;
      return editMembershipIds[0] || '';
    });
  }, [editMembershipIds, editOpenId]);

  function closeEdit() {
    setEditOpenId(null);
    setEditEmail('');
    setEditOrgId('');
    setEditRole('admin');
    setEditPassword('');
    setEditMembershipIds([]);
  }

  function openEdit(row) {
    setErr('');
    setOkMsg('');
    setEditOpenId(String(row.userId));
    setEditEmail(String(row.email || ''));
    const idsRaw = normalizeUserOrgIds(row);
    const fallback = idsRaw.length ? idsRaw : [String(row.orgId || '')].filter(Boolean);
    const reconciled = reconcileMembershipIdsWithCatalog(fallback, items);
    setEditMembershipIds(reconciled);
    const primRaw = String(row.orgId || reconciled[0] || '').trim();
    const primaryHit = items.find((o) => String(o.orgId ?? '').toLowerCase() === primRaw.toLowerCase());
    setEditOrgId(primaryHit ? String(primaryHit.orgId) : (reconciled[0] || primRaw || ''));
    setEditRole(String(row.role || 'viewer'));
    setEditPassword('');
  }

  /**
   * @param {string} orgIdVal
   * @param {boolean} checked
   */
  function toggleEditMembership(orgIdVal, checked) {
    const id = String(orgIdVal || '').trim();
    if (!id) return;
    setEditMembershipIds((prev) => {
      const base = prev.map(String).filter(Boolean);
      const withoutId = base.filter((x) => String(x).toLowerCase() !== id.toLowerCase());
      let next = checked ? [...withoutId, id] : withoutId;
      next = [...new Set(next)];
      if (!checked && next.length === 0) return base;
      return next;
    });
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    const uid = editOpenId;
    if (!uid) return;
    const token = getToken();
    if (!token) return;
    const target = users.find((u) => String(u.userId) === uid);
    const isSuper = target && String(target.role) === 'superadmin';
    setErr('');
    setOkMsg('');
    setEditSaving(true);
    /** @type {Record<string, unknown>} */
    const body = {};
    if (isSuper) {
      body.email = editEmail.trim().toLowerCase();
      if (editPassword.trim()) body.password = editPassword;
    } else {
      body.email = editEmail.trim().toLowerCase();
      const membership = reconcileMembershipIdsWithCatalog(
        [...new Set(editMembershipIds.map((x) => String(x || '').trim()).filter(Boolean))],
        items,
      );
      if (membership.length === 0) {
        setEditSaving(false);
        setErr('アクセス可能な組織を1つ以上選んでください');
        return;
      }
      const primaryTrim = editOrgId.trim();
      const primary =
        membership.find((m) => m === primaryTrim) ??
        membership.find((m) => m.toLowerCase() === primaryTrim.toLowerCase()) ??
        '';
      if (!primary) {
        setEditSaving(false);
        setErr('「既定の組織」は、チェックした組織のいずれかを選んでください');
        return;
      }
      body.orgIds = membership;
      body.orgId = primary;
      body.role = editRole;
      if (editPassword.trim()) body.password = editPassword;
    }
    const j = await patchPlatformUser(token, uid, body);
    setEditSaving(false);
    if (j._status === 401) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '更新に失敗しました');
      return;
    }
    setOkMsg('ユーザーを更新しました');
    closeEdit();
    await load();
  }

  async function onDeleteUser(row) {
    const uid = String(row.userId);
    const email = String(row.email || '');
    if (sessionUser?.id === uid) {
      setErr('ログイン中のアカウントは削除できません');
      return;
    }
    if (!window.confirm(`ユーザー「${email}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    const j = await deletePlatformUser(token, uid);
    if (j._status === 401) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '削除に失敗しました');
      return;
    }
    setOkMsg('ユーザーを削除しました');
    if (editOpenId === uid) closeEdit();
    await load();
  }

  async function onCreateOrg(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    setSavingOrg(true);
    const j = await createPlatformOrg(token, {
      orgId: orgId.trim(),
      slug: slug.trim().toLowerCase(),
      name: orgName.trim() || undefined,
    });
    setSavingOrg(false);
    if (j._status === 401) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : '組織の作成に失敗しました');
      return;
    }
    setOkMsg(`組織を作成しました。アクセスURL: ${publicOrgDashboardAbsoluteUrl(slug.trim().toLowerCase())}`);
    setOrgId('');
    setSlug('');
    setOrgName('');
    await load();
  }

  async function onCreateUser(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setErr('');
    setOkMsg('');
    setSavingUser(true);
    const j = await createPlatformUser(token, {
      email: userEmail.trim().toLowerCase(),
      password: userPassword,
      orgId: userOrgId.trim(),
      role: userRole,
    });
    setSavingUser(false);
    if (j._status === 401) {
      clearAuthSession();
      nav('/admin/login');
      return;
    }
    if (!j._ok) {
      setErr(typeof j.msg === 'string' ? j.msg : 'ユーザーの作成に失敗しました');
      return;
    }
    setOkMsg('ユーザーを作成しました');
    setUserEmail('');
    setUserPassword('');
    await load();
  }

  if (!getToken()) {
    return null;
  }

  const editingRow = editOpenId ? users.find((u) => String(u.userId) === editOpenId) : null;
  const editingIsSuper = editingRow && String(editingRow.role) === 'superadmin';

  return (
    <AdminLayout
      width="medium"
      title="組織の追加（プラットフォーム）"
      description={
        <>
          <strong>superadmin</strong> 専用です。新しいテナント用の Firestore{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded-md text-xs font-mono">orgs</code>{' '}
          ドキュメントを作成し、続けてその組織の管理者ユーザーを登録・一覧管理できます。
        </>
      }
    >
      {err && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4" role="alert">
          {err}
        </p>
      )}
      {okMsg && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-4">
          {okMsg}
        </p>
      )}

      {loading ? (
        <div className="surface-card p-8 flex flex-col items-center gap-4">
          <div
            className="h-9 w-9 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"
            aria-hidden
          />
          <p className="text-sm text-slate-600">読み込み中…</p>
        </div>
      ) : (
        <>
          <div className="surface-card p-5 mb-6">
            <h2 className="text-sm font-bold text-slate-900 mb-1">登録済み組織</h2>
            <p className="text-xs text-slate-500 mb-3">
              アクセス URL は通常この画面と同じサイトのドメインです。監視サイトを別ドメインに出している場合は{' '}
              <code className="text-[11px] bg-slate-100 px-1 rounded">VITE_PUBLIC_APP_ORIGIN</code>{' '}
              で正しいオリジンを指定してください。
            </p>
            {items.length === 0 ? (
              <p className="text-xs text-slate-500">まだありません</p>
            ) : (
              <ul className="text-sm space-y-3">
                {items.map((row) => {
                  const slugStr = String(row.slug ?? '');
                  const abs = publicOrgDashboardAbsoluteUrl(slugStr);
                  const pathOnly = monitorHomePath(slugStr);
                  return (
                    <li
                      key={String(row.orgId)}
                      className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 space-y-1.5"
                    >
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md">{String(row.orgId)}</span>
                        {row.disabled ? <span className="text-xs text-amber-800 font-medium">無効</span> : null}
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">アクセス URL（監視）</span>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <a
                            href={abs}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-mono text-[11px] sm:text-xs text-sky-800 break-all underline underline-offset-2 hover:text-sky-950"
                          >
                            {abs}
                          </a>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-[11px] text-slate-500">パス {pathOnly}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form onSubmit={onCreateOrg} className="surface-card p-5 sm:p-6 mb-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">新規組織</h2>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">組織ID</span>
              <input
                type="text"
                value={orgId}
                onChange={(ev) => setOrgId(ev.target.value)}
                className="input-field mt-1.5 font-mono text-[13px]"
                placeholder="例: kitasato-2025"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">URL スラッグ（公開パス /tenant/&lt;slug&gt;）</span>
              <input
                type="text"
                value={slug}
                onChange={(ev) => setSlug(ev.target.value)}
                className="input-field mt-1.5 font-mono text-[13px]"
                placeholder="例: kitasato"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">表示名（任意）</span>
              <input
                type="text"
                value={orgName}
                onChange={(ev) => setOrgName(ev.target.value)}
                className="input-field mt-1.5"
                maxLength={200}
                autoComplete="off"
              />
            </label>
            <button type="submit" disabled={savingOrg} className="btn-primary-solid w-full py-3">
              {savingOrg ? '作成中…' : '組織を作成'}
            </button>
          </form>

          <div className="surface-card p-5 mb-6 overflow-hidden">
            <h2 className="text-sm font-bold text-slate-900 mb-1">登録済みユーザー</h2>
            <p className="text-xs text-slate-500 mb-3">
              全テナントのログインアカウントです。<strong>superadmin</strong> はメール・パスワードのみ変更できます（最後の1人は削除不可）。
              <strong className="text-slate-600"> admin / viewer</strong> は編集で複数組織を付与でき、ユーザーの管理画面で組織を切り替えられます。
            </p>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs sm:text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-slate-600 border-b border-slate-200">
                    <th className="py-2 pr-2 font-semibold">メール</th>
                    <th className="py-2 pr-2 font-semibold whitespace-nowrap">組織</th>
                    <th className="py-2 pr-2 font-semibold">ロール</th>
                    <th className="py-2 pr-2 font-semibold whitespace-nowrap hidden sm:table-cell">作成</th>
                    <th className="py-2 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => {
                    const rid = String(row.userId);
                    const isSelf = sessionUser?.id === rid;
                    const role = String(row.role || '');
                    return (
                      <tr key={rid} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-2 align-top">
                          <span className="break-all">{String(row.email || '')}</span>
                          {isSelf ? (
                            <span className="block text-[10px] text-sky-700 font-medium mt-0.5">ログイン中</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-2 align-top text-xs font-mono leading-snug">
                          {formatUserOrgScopeCell(row)}
                        </td>
                        <td className="py-2 pr-2 align-top">
                          {role === 'superadmin' ? (
                            <span className="text-violet-800 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded text-[11px] font-medium">
                              superadmin
                            </span>
                          ) : role === 'admin' ? (
                            <span className="text-slate-700">admin</span>
                          ) : (
                            <span className="text-slate-600">viewer</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-slate-500 whitespace-nowrap align-top hidden sm:table-cell">
                          {formatTs(row.createdAt)}
                        </td>
                        <td className="py-2 align-top text-right whitespace-nowrap">
                          <button
                            type="button"
                            className="text-sky-800 font-medium hover:underline mr-2"
                            onClick={() => openEdit(row)}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            className="text-red-700 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
                            onClick={() => onDeleteUser(row)}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {users.length === 0 ? <p className="text-xs text-slate-500 mt-2">ユーザーがまだありません</p> : null}

            {editOpenId ? (
              <form onSubmit={onSaveEdit} className="mt-5 pt-5 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-800">ユーザーを編集</h3>
                {editingIsSuper ? (
                  <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    このアカウントは <strong>superadmin</strong> です。メールとパスワード（任意）のみ変更できます。
                  </p>
                ) : null}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">メール</span>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(ev) => setEditEmail(ev.target.value)}
                    className="input-field mt-1.5"
                    required
                    autoComplete="off"
                  />
                </label>
                {!editingIsSuper ? (
                  <>
                    <fieldset className="border border-slate-200 rounded-xl p-3 space-y-2">
                      <legend className="text-xs font-semibold text-slate-600 px-1">アクセス可能な組織</legend>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        チェックした組織にログイン後、ヘッダーから切り替え可能です。最後の1つは外せません。
                        <span className="block mt-1">
                          保存済みの組織 ID と一覧の表記（大文字／小文字）が違う場合は、自動で一覧の ID に揃えます。
                        </span>
                      </p>
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {items.map((o) => {
                          const oid = String(o.orgId);
                          const checked = editMembershipIds.includes(oid);
                          const onlyOne = editMembershipIds.length === 1 && checked;
                          return (
                            <li key={oid} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                id={`edit-org-${oid}`}
                                className="mt-1 rounded border-slate-300"
                                checked={checked}
                                disabled={onlyOne}
                                onChange={(ev) => toggleEditMembership(oid, ev.target.checked)}
                              />
                              <label htmlFor={`edit-org-${oid}`} className="text-xs cursor-pointer leading-snug">
                                <span className="font-mono font-medium text-slate-800">{oid}</span>
                                <span className="text-slate-500">{` · ${String(o.slug ?? '')}`}</span>
                              </label>
                            </li>
                          );
                        })}
                        {editMembershipIds
                          .filter((mid) => !items.some((o) => String(o.orgId) === mid))
                          .map((mid) => {
                            const checked = editMembershipIds.includes(mid);
                            const onlyOne = editMembershipIds.length === 1 && checked;
                            return (
                              <li key={`orph-${mid}`} className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  id={`edit-org-orph-${mid}`}
                                  className="mt-1 rounded border-amber-400"
                                  checked={checked}
                                  disabled={onlyOne}
                                  onChange={(ev) => toggleEditMembership(mid, ev.target.checked)}
                                />
                                <label htmlFor={`edit-org-orph-${mid}`} className="text-xs cursor-pointer leading-snug">
                                  <span className="font-mono font-medium text-amber-950">{mid}</span>
                                  <span className="text-amber-900/90">（プラットフォーム組織一覧に無し）</span>
                                </label>
                              </li>
                            );
                          })}
                      </ul>
                      {editMembershipIds.some((mid) => !items.some((o) => String(o.orgId) === mid)) ? (
                        <p className="text-[11px] text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5 border border-amber-100">
                          一覧に無い組織 ID は保存時にバックエンドで拒否されます。チェックを外すか、先に「新規組織」で登録してください。
                        </p>
                      ) : null}
                    </fieldset>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">既定の組織（トークンのスコープ）</span>
                      <select
                        value={editOrgId}
                        onChange={(ev) => setEditOrgId(ev.target.value)}
                        className="input-field mt-1.5 font-mono text-[13px]"
                        required
                      >
                        {editMembershipIds.filter((mid) => !items.some((o) => String(o.orgId) === mid)).map((mid) => (
                          <option key={mid} value={mid}>
                            {mid}（一覧外）
                          </option>
                        ))}
                        {items
                          .filter((o) => editMembershipIds.includes(String(o.orgId)))
                          .map((o) => (
                            <option key={String(o.orgId)} value={String(o.orgId)}>
                              {String(o.orgId)} ({String(o.slug)})
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">ロール</span>
                      <select
                        value={editRole}
                        onChange={(ev) => setEditRole(ev.target.value)}
                        className="input-field mt-1.5"
                      >
                        <option value="admin">admin</option>
                        <option value="viewer">viewer</option>
                      </select>
                    </label>
                  </>
                ) : null}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">新しいパスワード（変更する場合のみ8文字以上）</span>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(ev) => setEditPassword(ev.target.value)}
                    className="input-field mt-1.5"
                    autoComplete="new-password"
                    placeholder="変更しない場合は空のまま"
                  />
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="submit" disabled={editSaving} className="btn-primary-solid px-5 py-2 text-sm">
                    {editSaving ? '保存中…' : '保存'}
                  </button>
                  <button type="button" className="btn-secondary-outline px-5 py-2 text-sm" onClick={closeEdit}>
                    キャンセル
                  </button>
                </div>
              </form>
            ) : null}
          </div>

          <form onSubmit={onCreateUser} className="surface-card p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">組織の管理者ユーザーを作成</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              上記で作成した組織の <code className="bg-slate-100 px-1.5 rounded text-[11px]">orgId</code>{' '}
              を選び、別メールで管理者を追加できます。
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">所属組織 ID</span>
              <select
                value={userOrgId}
                onChange={(ev) => setUserOrgId(ev.target.value)}
                className="input-field mt-1.5 font-mono text-[13px]"
              >
                <option value="">選択してください</option>
                {items.map((row) => (
                  <option key={String(row.orgId)} value={String(row.orgId)}>
                    {String(row.orgId)} ({String(row.slug)})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">メール</span>
              <input
                type="email"
                value={userEmail}
                onChange={(ev) => setUserEmail(ev.target.value)}
                className="input-field mt-1.5"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">パスワード（8文字以上）</span>
              <input
                type="password"
                value={userPassword}
                onChange={(ev) => setUserPassword(ev.target.value)}
                className="input-field mt-1.5"
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">ロール</span>
              <select
                value={userRole}
                onChange={(ev) => setUserRole(ev.target.value)}
                className="input-field mt-1.5"
              >
                <option value="admin">admin（施設・デバイス管理）</option>
                <option value="viewer">viewer（閲覧のみ）</option>
              </select>
            </label>
            <button type="submit" disabled={savingUser} className="btn-secondary-outline w-full py-3">
              {savingUser ? '作成中…' : 'ユーザーを作成'}
            </button>
          </form>
        </>
      )}

      <p className="pt-8 text-center text-sm">
        <Link to="/admin" className="font-semibold text-slate-600 hover:text-sky-800 underline underline-offset-4">
          ← 管理メニュー
        </Link>
      </p>
    </AdminLayout>
  );
}
