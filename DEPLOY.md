# guardian_wbgt デプロイ・環境変数

## 前提

- Firebase CLI、Node.js 22
- プロジェクト ID: `.firebaserc` の `default`（例: `wbgt-monitor-d5556`）

## Hosting + Functions

```bash
cd frontend && npm ci && npm run build
cd ../functions && npm ci
firebase deploy --only "firestore,functions,hosting"
```

**PowerShell** では `deploy --only` のカンマ区切りも引用符で囲むことを推奨します。

ルートの `scripts/deploy-production.ps1` / `scripts/deploy-functions.ps1` は、`firebase deploy` に **常に `-P <プロジェクト ID>` を付けます**。`-Project` を省略した場合は `.firebaserc` の `projects.default` を読むため、`firebase use` と別プロジェクトでも **リポジトリの設定がデプロイ先になります**（意図的に別プロジェクトへ載せたいときだけ `-Project other-id` を指定）。

## Functions シークレット（本番必須）

Firebase Console または CLI で設定する例:


| 変数                      | 説明                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `BUILDICS_API_KEY`      | BUILDICS API キー（Base64 エンコード済み文字列）                                                                                    |
| `JWT_ACCESS_SECRET`     | Access JWT 用（十分長い乱数）                                                                                                  |
| `JWT_REFRESH_SECRET`    | Refresh JWT 用（Access と別の値）                                                                                            |
| `ALLOWED_ORIGINS`       | CORS 許可オリジン（カンマ区切り。例: `https://example.com`）                                                                          |
| `DEFAULT_ORG_ID`        | 組織 ID（未設定時は `default`）                                                                                                |
| `AUTH_BOOTSTRAP_SECRET` | 初回 superadmin 用。**関数 `api` の環境変数（平文）**で設定。`npm run secrets:set-bootstrap` で乱数を生成し `.env` に書いたうえ、**同じ値を Console に登録**。 |
| `SHOW_DEMO_FORECAST`    | `true` / `false`（デモ予報・天気の扱い）                                                                                          |
| `COOKIE_SECURE`         | 本番で `true`（HTTPS のみ Cookie）                                                                                           |


`**AUTH_BOOTSTRAP_SECRET`（値の生成）** — ローカルで乱数を作り `.env` に保存し、**Firebase Console で関数 `api` の環境変数に同じ値を貼る**運用です（Secret Manager は使いません。平文 env と Secret の**同名二重定義**で Cloud Run が 400 になるため）。

```bash
cd functions && npm run secrets:set-bootstrap
```

- 生成後、**Firebase Console** → **Functions** → `**api`** → **環境変数**に `AUTH_BOOTSTRAP_SECRET` を追加（値は `functions/.env` と一致）
- **dry-run**: `DRY_RUN=1 npm run secrets:set-bootstrap`（PowerShell: `$env:DRY_RUN='1'; npm run secrets:set-bootstrap`）

**過去に Secret Manager 版をデプロイした場合**（`Secret environment variable overlaps non secret environment variable`）は、**いまのコードは平文 env のみ**です。Cloud Run の **「シークレット」としての `AUTH_BOOTSTRAP_SECRET` 参照を削除**してから `firebase deploy --only functions` してください。

- [Cloud Run](https://console.cloud.google.com/run) → `api`（`asia-northeast1`）→ 編集 → **シークレット** から当該エントリを削除、**変数** に平文で `AUTH_BOOTSTRAP_SECRET` を 1 つだけ置く。

**エミュレータ**では `FUNCTIONS_EMULATOR=true` 時、JWT にローカル用フォールバックがある。本番では必ず上記シークレットを設定すること。

## 初回プラットフォーム管理者（superadmin）の作成（1 回のみ）

`users` コレクションが **0 件**のときだけ、`POST /api/auth/bootstrap` で **1 人目が `role: superadmin`** として作成されます。通常の組織管理者（`admin`）は、ログイン後の **プラットフォーム画面**から追加してください。

```bash
curl -X POST "https://<your-hosting-domain>/api/auth/bootstrap" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Secret: <AUTH_BOOTSTRAP_SECRET>" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"xxxxxxxx\"}"
```

実際の URL は Firebase Console の `api` 関数の HTTP URL に合わせる。**パスは `/api/auth/bootstrap`**（Hosting 経由なら `https://<site>/api/auth/bootstrap`）。

**トラブルシュート（HTML の「404 Page not found」）:** ブラウザや `curl` で `GET https://<site>/api/public/config` を試し、**JSON ではなく HTML の 404** になる場合、Cloud Functions（`api`）が未デプロイか、`firebase.json` の `hosting.rewrites`（`/api/**` → `api`）が Hosting に反映されていません。プロジェクトルートで `firebase deploy --only "functions,hosting"` を実行し、Console で関数 **api**（**asia-northeast1**）の有無と、`.firebaserc` の default プロジェクトと Hosting の実プロジェクトが一致しているかを確認してください。

### スクリプトで初回のみ自動化（本番・CI 向け）

まず `POST /api/auth/bootstrap` を呼びます。`users` が 0 件なら **superadmin** を 1 人作成します。**既にユーザーがいると 409** になりますが、その場合は続けて `POST /api/auth/bootstrap-superadmin` を呼び、`.env` の `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` で **新規 superadmin の作成または既存ユーザーの昇格**を行います（いずれも成功で終了コード 0）。

環境変数:


| 変数                         | 説明                                                                      |
| -------------------------- | ----------------------------------------------------------------------- |
| `BOOTSTRAP_BASE_URL`       | Hosting のオリジン（例: `https://wbgt-monitor-d5556.web.app`、末尾スラッシュなし） |
| `AUTH_BOOTSTRAP_SECRET`    | Functions と同一                                                           |
| `BOOTSTRAP_ADMIN_EMAIL`    | superadmin 用メール（未設定時は `SEED_ADMIN_EMAIL` をフォールバック）                      |
| `BOOTSTRAP_ADMIN_PASSWORD` | 8 文字以上（未設定時は `SEED_ADMIN_PASSWORD`）                                     |
| `SKIP_BOOTSTRAP_PROBE`     | `1` のときのみ、`bootstrap:first-admin` の GET 事前チェックを省略（非推奨）                         |


```bash
cd functions
export BOOTSTRAP_BASE_URL="https://<your-hosting-domain>"
export AUTH_BOOTSTRAP_SECRET="<secret>"
export BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
export BOOTSTRAP_ADMIN_PASSWORD="<8文字以上>"
npm run bootstrap:first-admin
```

**リポジトリ直下**からでも同じスクリプトを実行できます（`package.json` が `functions` に委譲します）: 環境変数を設定したうえで `npm run bootstrap:first-admin`（ルートで `npm install` は不要）。

**Windows（PowerShell）:** リポジトリルートで:

```powershell
.\scripts\bootstrap-first-admin.ps1 -BootstrapBaseUrl "https://<your-hosting-domain>" -AuthBootstrapSecret "<secret>" -AdminEmail "admin@example.com" -AdminPassword "<8文字以上>"
```

パラメータを省略した場合は、既存のプロセス環境変数のあと `functions/.env`（`BOOTSTRAP_*` / `SEED_*` / `AUTH_BOOTSTRAP_SECRET`）が読み込まれます。初回のみ: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

GitHub Actions ではリポジトリ **Secrets** に上記を登録し、`workflow_dispatch` で 1 回実行するジョブ例は `.github/workflows/bootstrap-first-admin.yml` を参照。

### `bootstrap` / `bootstrap-first-admin` が **403 Forbidden** になるとき

次のどれかが原因です。

1. **本番 Cloud Functions に `AUTH_BOOTSTRAP_SECRET` が未設定**、またはローカルの値と違う
  - Firebase Console の **Functions → api → 環境変数**、または Secret Manager＋デプロイで設定した値と、`.env` / PowerShell パラメータの値が **一字一句同じ**か確認（設定後は `**firebase deploy --only functions:api`** などで再デプロイが必要な場合があります）。
2. **ローカルだけシークレットを書いて、クラウドに載せていない**
  - `.env` はデプロイされません。**本番で使う秘密は必ず Functions の環境に登録**してください。
3. **別プロジェクト・別環境の URL に向けている**
  - `BOOTSTRAP_BASE_URL` が実際にデプロイした Hosting と同一プロジェクトか確認してください。

サーバー側ではヘッダと環境変数の**前後空白を trim して比較**しますが、値そのものが違う場合は 403 のままです。

### ローカル: コマンドで自動登録（推奨）

`functions/.env` に次を設定したうえで、**Functions エミュレータ起動後**:

- `AUTH_BOOTSTRAP_SECRET`（bootstrap 用と同じ）
- `SEED_ADMIN_EMAIL`（例: `admin@localhost.local`）
- `SEED_ADMIN_PASSWORD`（**8 文字以上**）

```bash
cd functions && npm run seed:admin
```

既にユーザーがいる場合は **409** となり、スクリプトは成功終了（スキップ）します。接続できない場合は `FUNCTIONS_EMULATOR_URL` をエミュレータの表示に合わせて上書きしてください（`.env.example` 参照）。

## デバイス台帳と BUILDICS プロキシ

Firestore に `devices` ドキュメントが **1 件でも**存在すると、`POST /api/buildics` はリクエスト内の `deviceId` が自組織の台帳に登録済みであることを検証する。

台帳ゼロの間は従来どおり（設定 JSON の deviceId で動作）。本番運用では管理画面からデバイス登録後、不要なら `RELAX_DEVICE_SCOPE` を使わないこと。

## ローカル開発

### エミュレータの初回セットアップ（任意）

リポジトリの `firebase.json` に `**emulators` ブロックは既に含まれています**。初回のみ Firebase CLI からエミュレータ用バイナリの取得確認などをしたい場合は、プロジェクトルートで次を実行します（**対話式**のため、ターミナルで選択してください）。

```bash
firebase init emulators
```

- 利用するエミュレータとして **Functions** / **Firestore** / （必要なら）**Hosting** などにチェック
- ポートは `firebase.json` の `emulators` と一致させます（Functions **`65001`**、Firestore **`63130`**、Hosting **`5000`**、UI **`63140`**、Hub **`63100`** 等）。**同じプロジェクトで Emulator を二重起動**すると「multiple instances」警告とポート競合が出ます。不要なターミナルは **Ctrl+C** で止め、`java` / `node` が残っていれば終了してください。ポートが競合する場合は `firebase.json` の該当 `port` と、`functions` なら `frontend/vite.config.js` の `/api` プロキシ **`target`**、Firestore なら `FIRESTORE_EMULATOR_HOST` を同じ番号に揃えて変更します。

### エミュレータへ網羅テストデータ（任意）

1. プロジェクトルートで Firestore エミュレータを起動します（例: `firebase emulators:start --only firestore`）。
2. **Firestore のみ**のときはポート **`63130`**（`firebase.json` の `emulators.firestore.port`）に合わせ、次を実行します。

```bash
# PowerShell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:63130"
cd functions
npm run seed:test-data
```

```bash
# Bash
export FIRESTORE_EMULATOR_HOST=127.0.0.1:63130
cd functions && npm run seed:test-data
```

- 内容確認のみ: `npm run seed:test-data -- --dry-run`
- 投入後は `/tenant/default` および `/tenant/acme` 用の `orgs` / `facilities` / `devices` が揃います（本番・実プロジェクトでは実行しないこと）。

### エミュレータ起動・フロント

1. プロジェクトルートでエミュレータを起動します（例）。
  ```bash
   firebase emulators:start --only "functions,firestore"
  ```
   **PowerShell** では `--only` のカンマ区切りが引数に割れて `No emulators to start` になることがあるため、**必ず引用符で囲んでください**。初回管理者は `cd functions && npm run seed:admin`（上記 `functions/.env` の `SEED_`* 設定後）で登録できます。
2. `frontend` で `npm run dev` — `vite.config.js` の `/api` プロキシが `http://127.0.0.1:65001/wbgt-monitor-d5556/asia-northeast1/api` に転送されます（`.firebaserc` の `default` プロジェクト ID と一致している必要があります。`firebase.json` の `emulators.functions.port` を変えたらこの `target` も同じポートにしてください）。
3. BUILDICS を直接叩く場合は従来どおり `VITE_BUILDICS_API_KEY` と `/buildics-api` プロキシ

## フッターバージョン

`VERSION` ファイルと `frontend` ビルド時の `__APP_VERSION__` で表示を揃えている。