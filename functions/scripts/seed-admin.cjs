'use strict';

/**
 * 1) POST /api/auth/bootstrap — ユーザー 0 件時のみ初回 superadmin 作成
 * 2) （任意）POST /api/auth/bootstrap-superadmin — SEED_SUPERADMIN_EMAIL があれば 2 人目以降の superadmin 作成または昇格
 *
 * エミュレータ起動後: cd functions && npm run seed:admin
 */

const fs = require('fs');
const path = require('path');

try {
  /** override: true … シェルに空・誤値の AUTH_BOOTSTRAP_SECRET が残っていても .env を優先 */
  require('dotenv').config({
    path: path.join(__dirname, '..', '.env'),
    override: true,
  });
} catch {
  /* dotenv 未導入時は環境変数のみ */
}

const { normalizeAuthBootstrapSecret } = require('../lib/bootstrapSecretNormalize');

/** `.firebaserc` の default（なければ環境変数）— ローカル seed のエミュ URL はこれを使う */
function readDefaultProjectId() {
  const rc = path.join(__dirname, '..', '..', '.firebaserc');
  try {
    const j = JSON.parse(fs.readFileSync(rc, 'utf8'));
    return j.projects?.default || process.env.FIREBASE_PROJECT_ID || 'wbgt-monitor-d5556';
  } catch {
    return process.env.FIREBASE_PROJECT_ID || 'wbgt-monitor-d5556';
  }
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readFunctionsEmulatorPort() {
  const fj = path.join(__dirname, '..', '..', 'firebase.json');
  const j = readJsonSafe(fj);
  const p = j?.emulators?.functions?.port;
  return typeof p === 'number' && p > 0 ? p : 65001;
}

/**
 * `http://127.0.0.1:<functionsPort>` のみ指定されたとき、エミュへ届ける関数ベースへ展開する
 * （`bootstrap-first-admin.cjs` の normalize と同規則）。
 * `…/asia-northeast1/api` が無いまま `/api/auth/bootstrap` を叩くと 404 になる。
 */
function expandEmulatorHostPortOnlyBase(rawBase) {
  let base = String(rawBase || '').trim().replace(/\/$/, '');
  if (!base) return '';
  try {
    const u = new URL(base);
    const host = u.hostname.toLowerCase();
    const portNum = u.port === '' ? (u.protocol === 'https:' ? 443 : 80) : Number(u.port);
    const emuPort = readFunctionsEmulatorPort();
    const pathOnly = (u.pathname || '/').replace(/\/$/, '') || '';
    const isLocalEmuHost = host === '127.0.0.1' || host === 'localhost';
    if (isLocalEmuHost && portNum === emuPort && (pathOnly === '' || pathOnly === '/')) {
      const project = readDefaultProjectId();
      const region = process.env.FIREBASE_FUNCTIONS_REGION || 'asia-northeast1';
      const fn = process.env.FIREBASE_FUNCTION_NAME || 'api';
      return `${u.protocol}//${u.host}/${project}/${region}/${fn}`;
    }
  } catch {
    /* URL でなければ後段で検知 */
  }
  return base;
}

/**
 * FUNCTIONS_EMULATOR_URL に誤ったプロジェクト ID が含まれていても、
 * ローカル Functions エミュ向け (`127.0.0.1` / `localhost` + firebase.json の port) であれば
 * パス先頭 `[project]/[region]/[function]` を `.firebaserc` ベースへ上書きする。
 */
function rewriteLocalEmuFunctionsTriplePath(rawBase) {
  const s = String(rawBase || '').trim().replace(/\/$/, '');
  if (!s) return '';
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    const portNum = u.port === '' ? (u.protocol === 'https:' ? 443 : 80) : Number(u.port);
    const emuPort = readFunctionsEmulatorPort();
    if ((host !== '127.0.0.1' && host !== 'localhost') || portNum !== emuPort) {
      return s;
    }
    const segs = u.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const project = readDefaultProjectId();
    const region = process.env.FIREBASE_FUNCTIONS_REGION || 'asia-northeast1';
    const fnName = process.env.FIREBASE_FUNCTION_NAME || 'api';
    if (segs.length < 3) {
      return s;
    }
    const rest = segs.length > 3 ? segs.slice(3).join('/') : '';
    const rebuilt = `${project}/${region}/${fnName}${rest ? `/${rest}` : ''}`;
    const out = `${u.protocol}//${u.host}/${rebuilt}`;
    if (out !== s) {
      console.warn('[seed-admin] ローカルエミュ URL を .firebaserc / 関数設定に合わせて補正:', s, '→', out);
    }
    return out;
  } catch {
    return s;
  }
}

/**
 * .env の値に「FUNCTIONS_EMULATOR_URL=http://...」まるごと貼り付けた誤りや
 * 前後の引用符・BOM を除去してベース URL のみにする。
 */
function normalizeEmulatorBaseFromEnv(raw) {
  if (raw == null || String(raw).trim() === '') return '';
  let s = String(raw).replace(/^\uFEFF/, '').trim();
  s = s.replace(/^["']+|["']+$/g, '');
  const wholeLine = /^FUNCTIONS_EMULATOR_URL\s*=\s*(.+)$/i.exec(s);
  if (wholeLine) s = wholeLine[1].trim();
  if (/^FUNCTIONS_EMULATOR_URL\s*=/i.test(s)) {
    s = s.replace(/^FUNCTIONS_EMULATOR_URL\s*=\s*/i, '').trim();
  }
  if (!/^https?:\/\//i.test(s)) {
    const m = s.match(/https?:\/\/[^\s'"]+/i);
    if (m) s = m[0];
  }
  return s.replace(/\/$/, '');
}

function emulatorBaseUrl() {
  const project = readDefaultProjectId();
  const region = process.env.FIREBASE_FUNCTIONS_REGION || 'asia-northeast1';
  const fn = process.env.FIREBASE_FUNCTION_NAME || 'api';
  const fromEnv = normalizeEmulatorBaseFromEnv(process.env.FUNCTIONS_EMULATOR_URL);
  const built = fromEnv || `http://127.0.0.1:${readFunctionsEmulatorPort()}/${project}/${region}/${fn}`;
  return rewriteLocalEmuFunctionsTriplePath(expandEmulatorHostPortOnlyBase(built));
}

/** FUNCTIONS_EMULATOR_URL + リクエストパスがパース可能で、ポートが 1〜65535 か確認 */
function assertEmulatorRequestUrl(base, pathSuffix) {
  const urlStr = `${String(base).replace(/\/$/, '')}${pathSuffix}`;
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    throw new Error(
      `[seed-admin] URL をパースできません: ${urlStr}\n` +
        'functions/.env では「FUNCTIONS_EMULATOR_URL=http://...」のうち URL 部分だけが値になります（VARIABLE= を値に二重に含めない）。' +
        ' ポートは 1〜65535。全角記号・余計な改行に注意。',
    );
  }
  const port = u.port === '' ? (u.protocol === 'https:' ? 443 : 80) : Number(u.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `[seed-admin] ポートが無効です（TCP は 1〜65535）: ${u.port || '既定ポート'}\n` +
        '例: 66001 は上限超過でエラーになります。firebase.json の emulators.functions.port と FUNCTIONS_EMULATOR_URL を 65535 以下に揃えてください。',
    );
  }
}

async function postBootstrap(secret, base, email, password) {
  const url = `${base.replace(/\/$/, '')}/api/auth/bootstrap`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bootstrap-Secret': secret,
    },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { res, body };
}

async function postBootstrapSuperadmin(secret, base, email, password) {
  const url = `${base.replace(/\/$/, '')}/api/auth/bootstrap-superadmin`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bootstrap-Secret': secret,
    },
    body: JSON.stringify({ email, password: password || undefined }),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { res, body };
}

async function main() {
  const secret = normalizeAuthBootstrapSecret(process.env.AUTH_BOOTSTRAP_SECRET);
  const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';

  if (!secret) {
    console.error('[seed-admin] AUTH_BOOTSTRAP_SECRET が未設定です（functions/.env を参照）。');
    process.exit(1);
  }
  if (!email || !password || password.length < 8) {
    console.error(
      '[seed-admin] SEED_ADMIN_EMAIL と SEED_ADMIN_PASSWORD（8文字以上）を functions/.env に設定してください。',
    );
    process.exit(1);
  }

  const base = emulatorBaseUrl();
  assertEmulatorRequestUrl(base, '/api/auth/bootstrap');

  const boot = await postBootstrap(secret, base, email, password);

  if (boot.res.ok && (boot.body.code === 200 || boot.body.code == null)) {
    console.log('[seed-admin] 初回 superadmin を登録しました:', email);
  } else if (boot.res.status === 409 || boot.body.code === 409) {
    console.log('[seed-admin] 既にユーザーが存在するため bootstrap はスキップ（409）。');
  } else if (boot.res.status === 403 || boot.body.code === 403) {
    console.error('[seed-admin] bootstrap 403 Forbidden（X-Bootstrap-Secret と Emulator が読み込んだ AUTH_BOOTSTRAP_SECRET が一致していません）。');
    console.error('  1) functions/.env に AUTH_BOOTSTRAP_SECRET=... があるか確認（引用符は値に含めない）。');
    console.error('  2) .env を直したあと、Functions エミュレータを一度止めてから再起動してください（起動時だけ .env を読み込みます）。');
    console.error(
      '  3) エミュ起動用ターミナルで $env:AUTH_BOOTSTRAP_SECRET を一時設定している場合、.env と食い違うと 403 になります。不一致なら変数を外してからエミュを起動し直してください。',
    );
    console.error('  4) リクエスト先:', `${base}/api/auth/bootstrap`);
    process.exit(1);
  } else {
    console.error('[seed-admin] bootstrap 失敗', boot.res.status, boot.body);
    if (boot.res.status === 404) {
      console.error(
        '  確認: Firebase Functions エミュが起動しているか、URL が firebase.json の emulators.functions.port と一致しているか。',
      );
      console.error(`  接続試行先: ${base}/api/auth/bootstrap`);
      console.error(`  使用中のプロジェクト ID（.firebaserc / フォールバック）: ${readDefaultProjectId()}`);
      console.error(
        '  それでも 404 のときは Functions エミュが起動していること、firebase.json の emulators.functions.port とホストを確認してください。',
      );
      console.error(
        '  参考: …/api/api/auth は Cloud Function 名が api のため、Express のパス /api/… に続く形でよくある組み合わせです。',
      );
    }
    process.exit(1);
  }

  const superEmail = (process.env.SEED_SUPERADMIN_EMAIL || '').trim().toLowerCase();
  if (!superEmail) {
    console.log('[seed-admin] SEED_SUPERADMIN_EMAIL 未設定のため superadmin 自動作成はスキップしました。');
    process.exit(0);
  }

  /** SEED_SUPERADMIN_PASSWORD 省略時は既存ユーザーの昇格のみ（パスワード据え置き）。新規には8文字以上が必要 */
  const superPassword = process.env.SEED_SUPERADMIN_PASSWORD || '';
  const sb = await postBootstrapSuperadmin(secret, base, superEmail, superPassword);

  if (sb.res.ok && sb.body.code === 200) {
    const act = sb.body.action === 'promoted' ? '昇格' : '新規作成';
    console.log('[seed-admin] superadmin:', superEmail, `（${act}）`);
    process.exit(0);
  }

  console.error('[seed-admin] bootstrap-superadmin 失敗', sb.res.status, sb.body);
  process.exit(1);
}

main().catch((e) => {
  const msg = e && e.message ? String(e.message) : String(e);
  console.error(msg.startsWith('[seed-admin]') ? msg : `[seed-admin] ${msg}`);
  const rawHint =
    normalizeEmulatorBaseFromEnv(process.env.FUNCTIONS_EMULATOR_URL) ||
    `http://127.0.0.1:${readFunctionsEmulatorPort()}`;
  console.error(
    '接続先の確認:',
    rewriteLocalEmuFunctionsTriplePath(expandEmulatorHostPortOnlyBase(rawHint)),
  );
  process.exit(1);
});
