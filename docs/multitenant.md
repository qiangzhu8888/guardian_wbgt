# マルチテナント（URL `/o/:orgSlug`）

## データ

- `**orgs` コレクション**（ドキュメント ID = `orgId`、アプリ内の `devices` / `facilities` の `orgId` と一致）
  - `slug`（一意・URL 用、小文字の `a-z0-9-`、1〜63 文字）
  - `name`（表示用・任意）
  - `disabled`（`true` なら公開設定 API は 404）
  - **公開ダッシュボード用**（任意・`GET /api/public/config` にマージ、シークレットは含めない）
    - `dashboardTitle` / `dashboardSubtitle` → 応答の `title` / `subtitle`
    - `themePrimary`（`#RRGGBB`）→ `themePrimary`
    - `logoUrl`（HTTPS・BFF の許可ホストのみ）→ `logoUrl`
  - **BUILDICS**（任意・**公開 API には出さない**）
    - `buildicsApiKey` … その org の `POST /api/buildics` で使用。**未設定時は** Functions の環境変数 `BUILDICS_API_KEY` にフォールバック

## 管理画面（組織設定）

管理者（`users.role === admin`・自 `orgId`）は `**/admin/org-settings`** から以下を更新できます。

- `GET /api/admin/org-settings` … 上記フィールドの編集用の値（`buildicsApiKey` はフルでは返さず、`buildicsApiKeyConfigured` など）
- `PATCH /api/admin/org-settings` … ダッシュボード表示・ロゴ URL・組織専用 BUILDICS キーの設定（キーに空文字を送ると組織キー削除＝環境変数フォールバック）

`slug` の変更はマルチテナントの一意制約のため、当面 Firestore コンソールまたは別運用で行ってください。

## プラットフォーム管理者（`superadmin`）

**新規組織の作成**は、`users.role === 'superadmin'` のアカウントだけが `**/admin/platform/orgs`**（API: `GET/POST /api/admin/platform/orgs`）から実行できます。

### 初回の `superadmin` の作り方

**推奨（ローカル / エミュレータ）:** `functions/.env` に `**SEED_SUPERADMIN_EMAIL`** を設定し、管理者シードと同じコマンドを実行します。

```bash
cd functions && npm run seed:admin
```

- `SEED_ADMIN_*` で最初のユーザー（`admin`）を作成したあと、内部で `**POST /api/auth/bootstrap-superadmin**` が呼ばれ、指定メールのユーザーを `**superadmin` に昇格**するか、未登録メールなら **新規 `superadmin` を作成**します。
- **初回 admin をそのまま superadmin にする例:** `SEED_SUPERADMIN_EMAIL` を `SEED_ADMIN_EMAIL` と同じにする。`SEED_SUPERADMIN_PASSWORD` は省略可（パスワードは変えずロールのみ変更）。
- **別メールで superadmin だけ増やす例:** 未登録の `SEED_SUPERADMIN_EMAIL` と、8 文字以上の `SEED_SUPERADMIN_PASSWORD` を設定する。

いずれも `**AUTH_BOOTSTRAP_SECRET`** による保護付きです。本番で使う場合はシークレットを強固にし、ネットワークから当該エンドポイントに届かないよう運用してください。

**本番・既存環境:** Firebase コンソールで `**users` の `role` を `superadmin`** に編集する方法も利用できます。

そのユーザーでログインし直すと、管理メニューに **「プラットフォーム：組織の追加」** が表示されます。

### プラットフォーム API（`superadmin` のみ）


| メソッド | パス                          | 内容                                                                                       |
| ---- | --------------------------- | ---------------------------------------------------------------------------------------- |
| GET  | `/api/admin/platform/orgs`  | 全 `orgs` の一覧（`buildicsApiKey` は含めない）                                                     |
| POST | `/api/admin/platform/orgs`  | 組織作成。ボディ: `orgId`, `slug`, `name`（任意）                                                    |
| POST | `/api/admin/platform/users` | 指定 `orgId` に管理者等を作成。ボディ: `email`, `password`（8文字以上）, `orgId`, `role`（`admin` / `viewer`） |


**通常の `admin`** は上記プラットフォーム API にはアクセスできません（403）。  
なお `**admin` 用の施設・デバイス API** は、`superadmin` も利用できます（自 `orgId` のデータ）。

### ログイン後の画面について

フロントはログイン応答の `user` を `sessionStorage` に保持し、`superadmin` かどうきでメニューを出し分けます。**メニューが出ない場合は一度ログアウト／再ログイン**してください。

## ロゴ URL の許可ホスト

BFF は `logoUrl` を検証します。既定で `storage.googleapis.com`・`firebasestorage.googleapis.com`・`*.googleapis.com` 配下のホスト・`*.firebasestorage.app` 配下のホストを許可します。追加は Functions の環境変数 `**LOGO_URL_ALLOWED_HOSTS`**（カンマ区切りホスト。`***.example.com`** 形式でサフィックス一致）を参照してください。

本番で **Content-Security-Policy の `img-src`** を厳しくしている場合は、同じホストを許可リストに含めてください。

## 既存デフォルトテナント（マイグレーションなし運用）

`orgs` に該当ドキュメントがなく、かつ URL スラッグが `**DEFAULT_ORG_SLUG`（未設定時は `default`）** のとき、BFF は `**DEFAULT_ORG_ID`（未設定時は `default`）** にフォールバックします。

本番で明示的に管理する場合の例（Firestore）:

- コレクション `orgs`
- ドキュメント ID: `default`（= `DEFAULT_ORG_ID` と同じ）
- フィールド: `slug: "default"`, `name: "既定組織"`

## 新規テナント追加手順

1. `orgId` を決める（例: `kitasato-2025`）
2. `orgs` にドキュメント ID `kitasato-2025`、フィールド `slug: "kitasato"`（URL は `/o/kitasato`）
3. その `orgId` で `facilities` / `devices` / 管理者 `users.orgId` を登録
4. 監視の URL を `https://<host>/o/kitasato` として共有

## 環境変数


| 変数                                  | 用途                                                             |
| ----------------------------------- | -------------------------------------------------------------- |
| `DEFAULT_ORG_ID`（Functions）         | フォールバック時の組織 ID・ブートストラップユーザー紐付け                                 |
| `DEFAULT_ORG_SLUG`（Functions）       | `orgs` 未登録時に許可する公開 URL スラッグ（通常 `default`）                      |
| `BUILDICS_API_KEY`（Functions）       | 組織ドキュメントに `buildicsApiKey` が無いときの **共通フォールバック**（BUILDICS プロキシ） |
| `LOGO_URL_ALLOWED_HOSTS`（Functions） | ロゴ `logoUrl` の追加許可ホスト（カンマ区切り。任意）                               |
| `VITE_DEFAULT_ORG_SLUG`（Frontend）   | `/` アクセス時の `Navigate` 先 `/o/<slug>`                            |


## 静的 `public/config/facilities.json`

テナント非対応の最終フォールバックです。本番では BFF の `/api/public/config?orgSlug=...` が成功することを前提にしてください。