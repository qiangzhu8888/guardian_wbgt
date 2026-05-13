'use strict';

const fs = require('fs');
const path = require('path');

/**
 * functions/.env を読み込む（ファイルがあるときのみ）。
 * Emulator が .env をプロセスへ載せない／空の環境変数で上書きされる場合でも、
 * seed:admin と同じキーを参照できるようにする。
 * 本番デプロイでは firebase.json の ignore により .env はパッケージに含まれない想定。
 */
function loadFunctionsDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: envPath, override: true });
}

module.exports = { loadFunctionsDotEnv };
