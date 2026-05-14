'use strict';

const fs = require('fs');
const path = require('path');

/**
 * functions/.env を読み込む（ファイルがあるときのみ）。
 * 続けてリポジトリ直下の .env を読み込み、**尚未設定のキーだけ**補完する（override: false）。
 * Emulator が .env をプロセスへ載せない／空の環境変数で上書きされる場合でも、
 * seed:admin と同じキーを参照できるようにする。
 *
 * 本番デプロイでは firebase.json の ignore により **どちらの .env もパッケージに含まれない**。
 * JWA 等は Google Cloud Secret（index.js の defineSecret 参照）で設定する。
 */
function loadFunctionsDotEnv() {
  const functionsDir = path.join(__dirname, '..');
  const functionsEnv = path.join(functionsDir, '.env');
  if (fs.existsSync(functionsEnv)) {
    // eslint-disable-next-line global-require
    require('dotenv').config({ path: functionsEnv, override: true });
  }
  const repoRootEnv = path.join(functionsDir, '..', '.env');
  if (fs.existsSync(repoRootEnv)) {
    // eslint-disable-next-line global-require
    require('dotenv').config({ path: repoRootEnv, override: false });
  }
}

module.exports = { loadFunctionsDotEnv };
