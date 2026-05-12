'use strict';

/**
 * 1) POST /api/auth/bootstrap — ユーザー 0 件時のみ初回 admin 作成
 * 2) （任意）POST /api/auth/bootstrap-superadmin — SEED_SUPERADMIN_EMAIL があれば superadmin 作成または昇格
 *
 * エミュレータ起動後: cd functions && npm run seed:admin
 */

const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  /* dotenv 未導入時は環境変数のみ */
}

function readDefaultProjectId() {
  const rc = path.join(__dirname, '..', '..', '.firebaserc');
  try {
    const j = JSON.parse(fs.readFileSync(rc, 'utf8'));
    return j.projects?.default || 'wgbt-monitor';
  } catch {
    return 'wgbt-monitor';
  }
}

function emulatorBaseUrl() {
  const project = process.env.FIREBASE_PROJECT_ID || readDefaultProjectId();
  const region = process.env.FIREBASE_FUNCTIONS_REGION || 'asia-northeast1';
  const fn = process.env.FIREBASE_FUNCTION_NAME || 'api';
  return (
    process.env.FUNCTIONS_EMULATOR_URL ||
    `http://127.0.0.1:5001/${project}/${region}/${fn}`
  );
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
  const secret = process.env.AUTH_BOOTSTRAP_SECRET;
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

  const boot = await postBootstrap(secret, base, email, password);

  if (boot.res.ok && (boot.body.code === 200 || boot.body.code == null)) {
    console.log('[seed-admin] 管理者を登録しました:', email);
  } else if (boot.res.status === 409 || boot.body.code === 409) {
    console.log('[seed-admin] 既にユーザーが存在するため bootstrap はスキップ（409）。');
  } else {
    console.error('[seed-admin] bootstrap 失敗', boot.res.status, boot.body);
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
  console.error('[seed-admin]', e.message);
  console.error(
    'エミュレータが起動しているか、URL が正しいか確認してください:',
    process.env.FUNCTIONS_EMULATOR_URL || '(既定 127.0.0.1:5001)',
  );
  process.exit(1);
});
