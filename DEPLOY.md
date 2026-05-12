# guardian_wbgt デプロイ・環境変数

## 前提

- Firebase CLI、Node.js 22
- プロジェクト ID: `.firebaserc` の `default`（例: `wgbt-monitor`）

## Hosting + Functions

```bash
cd frontend && npm ci && npm run build
cd ../functions && npm ci
firebase deploy --only "firestore,functions,hosting"
```

**PowerShell** では `deploy --only` のカンマ区切りも引用符で囲むことを推奨します。

## Functions シークレット（本番必須）

Firebase Console または CLI で設定する例:


| 変数                      | 説明                                           |
| ----------------------- | -------------------------------------------- |
| `BUILDICS_API_KEY`      | BUILDICS API キー（Base64 エンコード済み文字列）           |
| `JWT_ACCESS_SECRET`     | Access JWT 用（十分長い乱数）                         |
| `JWT_REFRESH_SECRET`    | Refresh JWT 用（Access と別の値）                   |
| `ALLOWED_ORIGINS`       | CORS 許可オリジン（カンマ区切り。例: `https://example.com`） |
| `DEFAULT_ORG_ID`        | 組織 ID（未設定時は `default`）                       |
| `AUTH_BOOTSTRAP_SECRET` | 初回管理者作成 `POST /api/auth/bootstrap` 用         |
| `SHOW_DEMO_FORECAST`    | `true` / `false`（デモ予報・天気の扱い）                 |
| `COOKIE_SECURE`         | 本番で `true`（HTTPS のみ Cookie）                  |


**エミュレータ**では `FUNCTIONS_EMULATOR=true` 時、JWT にローカル用フォールバックがある。本番では必ず上記シークレットを設定すること。

## 初回管理者の作成（1 回のみ）

```bash
curl -X POST "https://<your-hosting-domain>/api/auth/bootstrap" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Secret: <AUTH_BOOTSTRAP_SECRET>" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"xxxxxxxx\"}"
```

実際の URL は Firebase Console の `api` 関数の HTTP URL に合わせる。**パスは `/api/auth/bootstrap`**（Hosting 経由なら `https://<site>/api/auth/bootstrap`）。

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
- ポートは `firebase.json` の値（Functions `5001`、Firestore `8080`、Hosting `5000`、UI `4000`）と揃えると、`frontend` の Vite プロキシと整合しやすいです

### エミュレータへ網羅テストデータ（任意）

1. プロジェクトルートで Firestore エミュレータを起動します（例: `firebase emulators:start --only firestore`）。
2. **Firestore のみ**のときはポート **8080**（`firebase.json` の既定）に合わせ、次を実行します。

```bash
# PowerShell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
cd functions
npm run seed:test-data
```

```bash
# Bash
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
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
2. `frontend` で `npm run dev` — `vite.config.js` の `/api` プロキシが `http://127.0.0.1:5001/wgbt-monitor/asia-northeast1/api` に転送されます（`.firebaserc` の `default` プロジェクト ID と一致している必要があります）。
3. BUILDICS を直接叩く場合は従来どおり `VITE_BUILDICS_API_KEY` と `/buildics-api` プロキシ

## フッターバージョン

`VERSION` ファイルと `frontend` ビルド時の `__APP_VERSION__` で表示を揃えている。