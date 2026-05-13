'use strict';

/**
 * AUTH_BOOTSTRAP_SECRET 用の乱数を生成し、functions/.env に書き込む。
 * 本番では Firebase Console（または gcloud）で関数 api の「環境変数」に同じ名前・同じ値を登録する。
 *
 * Secret Manager / defineSecret は使わない（平文 env と Secret の二重定義で Cloud Run が 400 になるのを避ける）。
 *
 * 使い方: cd functions && npm run secrets:set-bootstrap
 *  dry-run: DRY_RUN=1 npm run secrets:set-bootstrap
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEY = 'AUTH_BOOTSTRAP_SECRET';
const functionsDir = path.join(__dirname, '..');
const envPath = path.join(functionsDir, '.env');

function upsertKeyValue(content, key, value) {
  const line = `${key}=${value}`;
  const lines = (content || '').split(/\r?\n/);
  const keyRe = new RegExp(`^${key}\\s*=`);
  const out = [];
  let replaced = false;
  for (const row of lines) {
    if (keyRe.test(row)) {
      if (!replaced) {
        out.push(line);
        replaced = true;
      }
    } else {
      out.push(row);
    }
  }
  if (!replaced) out.push(line);
  return out.join('\n').replace(/\n+$/, '') + '\n';
}

function main() {
  const dry = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
  const value = crypto.randomBytes(32).toString('hex');

  if (dry) {
    console.log('[set-bootstrap-secret] DRY_RUN: 生成例（先頭のみ）:', value.slice(0, 8) + '…');
    process.exit(0);
  }

  try {
    const ec = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    fs.writeFileSync(envPath, upsertKeyValue(ec, KEY, value), 'utf8');
    console.log('[set-bootstrap-secret] 更新:', envPath);
  } catch (e) {
    console.error('[set-bootstrap-secret] .env 更新失敗:', e.message);
    process.exit(1);
  }

  console.log('\n次を実施してください:\n');
  console.log('1. Firebase Console → Functions → 関数「api」→ 環境変数');
  console.log(`   名前: ${KEY}`);
  console.log(`   値:   （上記 .env と同じ。コピーは .env を開いてください）\n`);
  console.log('2. まだ Secret Manager にだけ同じ名前がある場合は削除するか、Cloud Run の「シークレット」から');
  console.log('   当該参照を外してください（平文 env のみにする）。\n');
  console.log('3. firebase deploy --only functions\n');
}

main();
