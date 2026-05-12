'use strict';

/**
 * Firestore エミュレータへ網羅テストデータを投入します（本番・ステージングでは実行しないこと）。
 *
 * 前提:
 *   1) firebase emulators:start --only firestore （必要なら functions も）
 *   2) 環境変数 FIRESTORE_EMULATOR_HOST（例: 127.0.0.1:8080）を設定
 *
 * PowerShell:
 *   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
 *   cd functions; npm run seed:test-data
 *
 * Bash:
 *   export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
 *   cd functions && npm run seed:test-data
 *
 * 続けて API を叩く場合は seed:admin で管理者を作成してから。
 *
 * オプション:
 *   --dry-run  … 書き込みせず内容と検証結果のみ表示
 */

const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  /* optional */
}

const admin = require('firebase-admin');
const {
  orgs,
  facilities,
  devices,
  validateComprehensiveTestData,
} = require('../fixtures/comprehensiveTestData');

function readDefaultProjectId() {
  const rc = path.join(__dirname, '..', '..', '.firebaserc');
  try {
    const j = JSON.parse(fs.readFileSync(rc, 'utf8'));
    return j.projects?.default || 'wgbt-monitor';
  } catch {
    return 'wgbt-monitor';
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const errs = validateComprehensiveTestData();
  if (errs.length) {
    console.error('[seed-test-data] フィクスチャ検証エラー:');
    errs.forEach((e) => console.error(' -', e));
    process.exit(1);
  }

  if (dryRun) {
    console.log('[seed-test-data] dry-run: フィクスチャ検証 OK');
    console.log('orgs:', orgs.length, 'facilities:', facilities.length, 'devices:', devices.length);
    process.exit(0);
  }

  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host) {
    console.error('[seed-test-data] FIRESTORE_EMULATOR_HOST が未設定です。');
    console.error('  例: $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"');
    process.exit(1);
  }

  const projectId =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || readDefaultProjectId();

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }
  const db = admin.firestore();
  const now = Date.now();
  const createdBy = 'seed-test-data';

  console.log('[seed-test-data] projectId=%s emulator=%s', projectId, host);

  const batch = db.batch();

  for (const o of orgs) {
    const docId = o._docId;
    const { _docId, ...rest } = o;
    const ref = db.collection('orgs').doc(String(docId));
    batch.set(
      ref,
      {
        ...rest,
        updatedAt: now,
        createdAt: o.createdAt === 1 ? now : o.createdAt,
        seededBy: createdBy,
      },
      { merge: true },
    );
  }

  for (const f of facilities) {
    const fid = f.facilityId;
    const ref = db.collection('facilities').doc(String(fid));
    batch.set(
      ref,
      {
        orgId: f.orgId,
        name: String(f.name).trim(),
        sortOrder: f.sortOrder != null ? Number(f.sortOrder) : 0,
        address: f.address != null ? String(f.address).slice(0, 500) : '',
        lat: f.lat != null && f.lat !== '' ? Number(f.lat) : null,
        lng: f.lng != null && f.lng !== '' ? Number(f.lng) : null,
        disabled: f.disabled === true,
        updatedAt: now,
        createdAt: now,
        createdBy,
      },
      { merge: true },
    );
  }

  for (const d of devices) {
    const ref = db.collection('devices').doc(String(d.deviceId));
    batch.set(
      ref,
      {
        orgId: d.orgId,
        label: d.label != null ? String(d.label) : '',
        facilityId: Number(d.facilityId),
        disabled: d.disabled === true,
        updatedAt: now,
        createdAt: now,
        createdBy,
      },
      { merge: true },
    );
  }

  await batch.commit();
  console.log(
    '[seed-test-data] 完了: orgs',
    orgs.length,
    'facilities',
    facilities.length,
    'devices',
    devices.length,
  );
  console.log('[seed-test-data] 公開URL例: /tenant/default  /tenant/acme');
}

main().catch((e) => {
  console.error('[seed-test-data]', e);
  process.exit(1);
});
