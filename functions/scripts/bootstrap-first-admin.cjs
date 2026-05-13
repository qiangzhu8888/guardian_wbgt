'use strict';

/**
 * 本番・検証環境で superadmin を登録する。
 *
 * 1) POST /api/auth/bootstrap … users が空のときのみ初回 1 人を作成
 * 2) 409（既にユーザーあり）のとき POST /api/auth/bootstrap-superadmin …
 *    BOOTSTRAP_ADMIN_EMAIL の新規作成または既存ユーザーの superadmin 昇格
 *
 * 環境変数:
 *   BOOTSTRAP_BASE_URL … Firebase Hosting のオリジンのみ（末尾 /api は付けない）
 *     例: https://your-site.web.app またはローカル Hosting エミュ http://127.0.0.1:5000
 *     Functions エミュをポートだけ指定したとき（http://127.0.0.1:65001）は
 *     自動で /<projectId>/asia-northeast1/api を補います（seed-admin と同じ）。
 *   AUTH_BOOTSTRAP_SECRET … Functions と同一
 *   SKIP_BOOTSTRAP_PROBE=1 … GET /api/public/config の事前チェックを省略（非推奨）
 *   BOOTSTRAP_ADMIN_EMAIL … または SEED_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_PASSWORD … または SEED_ADMIN_PASSWORD（8文字以上）
 *
 * 使用例:
 *   BOOTSTRAP_BASE_URL=https://example.web.app BOOTSTRAP_ADMIN_EMAIL=a@b.co BOOTSTRAP_ADMIN_PASSWORD='Secret123' AUTH_BOOTSTRAP_SECRET='...' node scripts/bootstrap-first-admin.cjs
 */

const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  /* optional */
}

function parseJsonBody(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readDefaultProjectId() {
  const rc = path.join(__dirname, '..', '..', '.firebaserc');
  const j = readJsonSafe(rc);
  return j?.projects?.default || process.env.FIREBASE_PROJECT_ID || 'wbgt-monitor-d5556';
}

function readFunctionsEmulatorPort() {
  const fj = path.join(__dirname, '..', '..', 'firebase.json');
  const j = readJsonSafe(fj);
  const p = j?.emulators?.functions?.port;
  return typeof p === 'number' && p > 0 ? p : 65001;
}

/**
 * Hosting はオリジンのみ。誤って末尾に /api が付いていると二重になり 404 になりやすい。
 * Functions エミュは「ポートだけ」の URL では /api/auth/bootstrap に届かず 404 になるためパスを補完する。
 *
 * @param {string} rawBase
 */
function normalizeBootstrapBaseUrl(rawBase) {
  let base = String(rawBase || '').trim().replace(/\/$/, '');
  if (!base) return '';
  base = base.replace(/\/api$/i, '');
  let u;
  try {
    u = new URL(base);
  } catch {
    return base;
  }
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
  return base;
}

function bodyLooksLikeHtml404(body) {
  const raw = body && typeof body.raw === 'string' ? body.raw : '';
  return /<html[\s>]/i.test(raw) || raw.includes('Page not found');
}

function responseLooksLikeGoogleHtml404(status, text) {
  const t = String(text || '');
  return (
    status === 404 &&
    (/<html[\s>]/i.test(t) || t.includes('Page not found') || t.includes('was not found on this server'))
  );
}

/**
 * GET /api/public/config で API が生きているか確認する（認証不要）。
 * Hosting が HTML の 404 を返すときは Functions 未デプロイまたはリライト未反映のことが多い。
 *
 * @param {string} base
 * @param {typeof fetch} [fetchImpl]
 */
async function probePublicApiReachable(base, fetchImpl = fetch) {
  const root = String(base || '').replace(/\/$/, '');
  const url = `${root}/api/public/config`;
  let res;
  let text;
  try {
    res = await fetchImpl(url, { method: 'GET', redirect: 'follow' });
    text = await res.text();
  } catch (e) {
    return { ok: false, url, networkError: String(e && e.message ? e.message : e) };
  }
  if (responseLooksLikeGoogleHtml404(res.status, text)) {
    return { ok: false, url, reason: 'html_404' };
  }
  try {
    JSON.parse(text);
    return { ok: true, url };
  } catch {
    /* 続行 */
  }
  if (res.ok) return { ok: true, url };
  return { ok: false, url, reason: 'non_json', status: res.status, snippet: text.slice(0, 200) };
}

function printBootstrapUrlHints(normalizedBase) {
  const emuPort = readFunctionsEmulatorPort();
  console.error('');
  console.error('[bootstrap-first-admin] Check BOOTSTRAP_BASE_URL:');
  console.error(`  Normalized BOOTSTRAP_BASE_URL: ${normalizedBase}`);
  console.error(
    '  Production: Firebase Hosting origin (e.g. https://YOURSITE.web.app) with no trailing /api (deploy Functions so `api` exists).',
  );
  console.error('  Local Hosting emulator: http://127.0.0.1:5000 etc. (see firebase.json emulators.hosting.port).');
  console.error(
    `  Local Functions emulator (port only expands to full URL): http://127.0.0.1:${emuPort} -> .../${readDefaultProjectId()}/asia-northeast1/api`,
  );
  console.error('');
}

function printFunctionsDeployHints(probeUrl) {
  console.error('[bootstrap-first-admin] /api is not reaching Functions (likely hosting rewrites, wrong project, or missing deploy).');
  console.error(`  Probe failed URL: ${probeUrl || '(unknown)'}`);
  console.error(
    '  After migrating Firebase projects, set BOOTSTRAP_BASE_URL (functions/.env or GitHub Actions BOOTSTRAP_BASE_URL secret) to your current Hosting origin.',
  );
  console.error('  Example: BOOTSTRAP_BASE_URL=https://wbgt-monitor-d5556.web.app');
  console.error('  From repo root with firebase login to the intended project:');
  console.error('    firebase deploy --only "functions,hosting"');
  console.error('  Or functions only: firebase deploy --only functions');
  console.error('  Check firebase.json hosting.rewrites: /api/** → function api.');
  console.error('  In Firebase Console → Functions, confirm api exists in asia-northeast1.');
  console.error('  Confirm .firebaserc default matches the project where Hosting is deployed.');
  console.error('');
  console.error('  Emergency only (not recommended): SKIP_BOOTSTRAP_PROBE=1 to skip the GET probe.');
  console.error('');
}

/**
 * @param {object} opts
 * @param {string} opts.base … 例 https://xxx.web.app（末尾スラッシュなし）
 * @param {string} opts.secret
 * @param {string} opts.email … 小文字化済み想定
 * @param {string} opts.password
 * @param {typeof fetch} [opts.fetchImpl]
 */
async function runBootstrapFirstAdmin({ base, secret, email, password, fetchImpl = fetch }) {
  const root = String(base || '').replace(/\/$/, '');
  const urlBootstrap = `${root}/api/auth/bootstrap`;
  const res = await fetchImpl(urlBootstrap, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bootstrap-Secret': secret,
    },
    body: JSON.stringify({ email, password }),
  });
  const body = parseJsonBody(await res.text());

  if (res.ok && (body.code === 200 || body.code == null)) {
    return { ok: true, log: `[bootstrap-first-admin] Created initial superadmin: ${email}` };
  }

  if (res.status === 409 || body.code === 409) {
    const urlSuper = `${root}/api/auth/bootstrap-superadmin`;
    const res2 = await fetchImpl(urlSuper, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bootstrap-Secret': secret,
      },
      body: JSON.stringify({ email, password }),
    });
    const body2 = parseJsonBody(await res2.text());
    if (res2.ok && body2.code === 200) {
      const verb = body2.action === 'promoted' ? 'promoted' : 'created';
      return { ok: true, log: `[bootstrap-first-admin] superadmin ${verb}: ${email}` };
    }
    return { ok: false, status: res2.status, body: body2 };
  }

  return { ok: false, status: res.status, body };
}

async function main() {
  const base = normalizeBootstrapBaseUrl(String(process.env.BOOTSTRAP_BASE_URL || '').trim());
  const secret = String(process.env.AUTH_BOOTSTRAP_SECRET || '').trim();
  const email = String(
    process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || '',
  )
    .trim()
    .toLowerCase();
  const password = String(
    process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || '',
  );

  if (!base) {
    console.error('[bootstrap-first-admin] BOOTSTRAP_BASE_URL is not set (example: https://your-site.web.app).');
    process.exit(1);
  }
  if (!secret) {
    console.error('[bootstrap-first-admin] AUTH_BOOTSTRAP_SECRET is not set.');
    process.exit(1);
  }
  if (!email || !password || password.length < 8) {
    console.error(
      '[bootstrap-first-admin] Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (8+ chars), or SEED_* equivalents.',
    );
    process.exit(1);
  }

  if (process.env.SKIP_BOOTSTRAP_PROBE === '1') {
    console.warn('[bootstrap-first-admin] SKIP_BOOTSTRAP_PROBE=1: skipping GET /api/public/config probe.');
  } else {
    const probe = await probePublicApiReachable(base);
    if (!probe.ok) {
      if (probe.networkError) {
        console.error('[bootstrap-first-admin] Probe network error:', probe.networkError);
      } else {
        console.error('[bootstrap-first-admin] Probe failed:', probe.reason || 'unknown', probe.status ?? '');
      }
      if (probe.reason === 'html_404' || probe.reason === 'non_json') {
        printFunctionsDeployHints(probe.url);
      } else {
        printBootstrapUrlHints(base);
      }
      process.exit(1);
    }
  }

  const result = await runBootstrapFirstAdmin({ base, secret, email, password });
  if (result.ok) {
    console.log(result.log);
    process.exit(0);
  }

  console.error('[bootstrap-first-admin] Request failed:', result.status, result.body);
  if (result.status === 404 || bodyLooksLikeHtml404(result.body)) {
    printBootstrapUrlHints(base);
  }
  process.exit(1);
}

module.exports = {
  runBootstrapFirstAdmin,
  parseJsonBody,
  normalizeBootstrapBaseUrl,
  readFunctionsEmulatorPort,
  readDefaultProjectId,
  probePublicApiReachable,
  responseLooksLikeGoogleHtml404,
};

if (require.main === module) {
  main().catch((e) => {
    console.error('[bootstrap-first-admin]', e.message);
    process.exit(1);
  });
}
