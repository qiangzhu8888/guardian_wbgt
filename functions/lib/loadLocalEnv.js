'use strict';

const fs = require('fs');
const path = require('path');

/**
 * functions/.env を読み込む（ファイルがあるときのみ）。
 * 続けてリポジトリ直下の .env を読み込み、**尚未設定のキーだけ**補完する（override: false）。
 * 最後に functions/.env.local を読み込み（存在すれば override: true）。
 *
 * Emulator が .env をプロセスへ載せない／空の環境変数で上書きされる場合でも、
 * seed:admin と同じキーを参照できるようにする。
 *
 * **デプロイ時の留意:** Firebase CLI はコードと別に、開発マシンの `functions/.env` および
 * `functions/.env.<PROJECT_ID>` から **平文の環境変数** を Cloud Run に載せます（公式ドキュメント
 * 「Environment variables」参照）。同名を `defineSecret` とも併用すると
 * 「Secret overlaps non secret」になり得ます。Secret 運用するキー（例: JWA_*）は `.env.local`
 * に置くか `.env` から除けてください（`.env.local` はエミュ用途で CLI が本番へ載せません）。
 *
 * firebase.json の ignore により .env は **アップロード tarball には含まれない** が、CLI は
 * ローカルの dotenv を読んでデプロイ仕様へマージする点は別問題である。
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
  const functionsEnvLocal = path.join(functionsDir, '.env.local');
  if (fs.existsSync(functionsEnvLocal)) {
    // eslint-disable-next-line global-require
    require('dotenv').config({ path: functionsEnvLocal, override: true });
  }
}

module.exports = { loadFunctionsDotEnv };
