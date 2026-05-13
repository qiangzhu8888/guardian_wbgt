# マルチテナント（URL `/tenant/:orgSlug`）

旧パス `/o/:orgSlug` はフロントで `/tenant/:orgSlug` へリダイレクトされます。

## データ

- `**orgs` コレクション**（ドキュメント ID = `orgId`、アプリ内の `devices` / `facilities` の `orgId` と一致）
  - `slug`（一意・URL 用、小文字の `a-z0-9-`、1〜63 文字）
  - `name`（表示用・任意）
  - `disabled`（`true` なら公開設定 API は 404）
  - **公開ダッシュボード用**（任意・`GET /api/public/config` にマージ、シークレットは含めない）
    - `dashboardTitle` / `dashboardSubtitle` → 応答の `title` / `subtitle`
    - `themePrimary`（`#RRGGBB`）→ `themePrimary`
    - `logoUrl`（HTTPS・BFF の許可ホストのみ）→ `logoUrl`。ファイルアップロード時は `**firebaseStorageDownloadTokens` 付き**の `firebasestorage.googleapis.com` URL になります（従来の `storage.googleapis.com` 直リンクも可）。
  - **BUILDICS**（任意・**公開 API には出さない**）
    - `buildicsApiKey` … その org の `POST /api/buildics` で使用。**未設定時は** Functions の環境変数 `BUILDICS_API_KEY` にフォールバック

### Firestore `users`（多組織・認証スコープ）

コンソール利用者は **`role`: `admin` | `viewer` | `superadmin`** とし、組織ごとに異なるロールは持ちません（同一ユーザーでグローバルな 1 ロール）。

- **`orgId`** … JWT と管理 API のスコープに使う **現在操作中の組織**。施設／デバイス／組織設定はこの ID でフィルタされます。
- **`orgIds`** … アクセス許可される組織 ID の配列（重複なし）。フィールドが無いレガシー行は読み取り時 **`[users.orgId]` と同義**とみなします。
- **`POST /api/auth/switch-org`**（Bearer、`admin` / `viewer` / `superadmin`）でボディ `{ orgId }` を送ると、Firestore の **`orgId` を同期**したうえで **新しい `accessToken`** と、ログインと同形の **`user`**（`orgIds`・`orgs: { orgId, orgSlug }[]` を含む）を返します。フロントの管理ヘッダーで複数組織があるときに切り替え可能です。`superadmin` は **`orgs` に存在する任意の組織**へ切り替え可能です。

`POST /api/admin/platform/users` 作成時は **`orgIds: [作成時 orgId]`** も保存します。対象が superadmin でないとき、`PATCH /api/admin/platform/users/:userId` のボディ **`orgIds`**（非空・各 ID は `orgs` に存在・重複除去）で所属一覧を更新できます。`orgIds` と同時指定する **`orgId` はリストに含まれる必要**があります。

## 管理画面（組織設定）

管理者（`users.role === admin`・自 `orgId`）は `**/admin/org-settings`** から以下を更新できます。

- `GET /api/admin/org-settings` … 上記フィールドの編集用の値（`buildicsApiKey` はフルでは返さず、`buildicsApiKeyConfigured` など）
- `POST /api/admin/org-logo` … ロゴ画像（PNG / JPEG / WebP / SVG、最大 2MB）を **Bearer 認証付きで生ボディ** 送信。Storage に保存し `orgs.logoUrl` を更新
- `PATCH /api/admin/org-settings` … ダッシュボード表示・`logoUrl` 手動上書き（HTTPS 許可 URL のみ）・ロゴ削除（`logoUrl` に空文字）・組織専用 BUILDICS キー（キーに空文字を送ると組織キー削除＝環境変数フォールバック）。ロゴを置き換え・削除した際、当アプリがアップロードした Storage オブジェクトは可能な範囲で削除します。

`slug` の変更はマルチテナントの一意制約のため、当面 Firestore コンソールまたは別運用で行ってください。

**初回のプラットフォーム管理者（`superadmin`）** は Firestore の `users` が空のときだけ `POST /api/auth/bootstrap` で **1 人の `superadmin` として**作成されます（`bootstrap-superadmin` は不要）。Hosting URL と環境変数を用意したうえで、冪等スクリプト `cd functions && npm run bootstrap:first-admin` による自動化が可能です（詳細はリポジトリの `DEPLOY.md`、GitHub の手動ワークフロー `.github/workflows/bootstrap-first-admin.yml`）。

**通常の組織管理者（`admin`）** は、その superadmin でログイン後に `**/admin/platform/orgs`** からユーザーを追加して作成します。

## プラットフォーム管理者（`superadmin`）

**新規組織の作成**は、`users.role === 'superadmin'` のアカウントだけが `**/admin/platform/orgs`**（API: `GET/POST /api/admin/platform/orgs`）から実行できます。

### 2 人目以降の `superadmin`

- `**POST /api/auth/bootstrap-superadmin`**（`bootstrap` と同じ `X-Bootstrap-Secret`）で、既存ユーザーの昇格または新規メールでの作成が可能です。
- **Firebase コンソール**で `users` の `role` を `superadmin` に編集する方法もあります。

**ローカル seed:** `npm run seed:admin` は `bootstrap` のあと、設定されていれば `bootstrap-superadmin` も呼びます。**初回は bootstrap だけで済む**ため、別メールの superadmin を同時に作りたいときなどに `SEED_SUPERADMIN_EMAIL` を使います。

いずれの bootstrap 系も `**AUTH_BOOTSTRAP_SECRET`** による保護付きです。

そのユーザーでログインし直すと、管理メニューに **「プラットフォーム：組織の追加」** が表示されます。

### プラットフォーム API（`superadmin` のみ）


| メソッド   | パス                                  | 内容                                                                                                                       |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/admin/platform/orgs`          | 全 `orgs` の一覧（`buildicsApiKey` は含めない）                                                                                     |
| POST   | `/api/admin/platform/orgs`          | 組織作成。ボディ: `orgId`, `slug`, `name`（任意）                                                                                    |
| GET    | `/api/admin/platform/users`         | 全 `users` の一覧（`passwordHash` は含めない）                                                                                      |
| POST   | `/api/admin/platform/users`         | 指定 `orgId` に管理者等を作成。ボディ: `email`, `password`（8文字以上）, `orgId`, `role`（`admin` / `viewer`）                                 |
| PATCH  | `/api/admin/platform/users/:userId` | 更新。ボディの任意項目: `email`, `password`（8文字以上）, `orgId`, `orgIds`（非空配列）, `role`（`admin` / `viewer`）。`**superadmin`** は `email`・`password` のみ変更可 |
| DELETE | `/api/admin/platform/users/:userId` | 削除。自分自身・最後の `superadmin` は不可                                                                                             |


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
2. `orgs` にドキュメント ID `kitasato-2025`、フィールド `slug: "kitasato"`（URL は `/tenant/kitasato`）
3. その `orgId` で `facilities` / `devices` / 管理者 `users.orgId` を登録
4. 監視の URL を `https://<host>/tenant/kitasato` として共有

## 環境変数


| 変数                                  | 用途                                                             |
| ----------------------------------- | -------------------------------------------------------------- |
| `DEFAULT_ORG_ID`（Functions）         | フォールバック時の組織 ID・ブートストラップユーザー紐付け                                 |
| `DEFAULT_ORG_SLUG`（Functions）       | `orgs` 未登録時に許可する公開 URL スラッグ（通常 `default`）                      |
| `BUILDICS_API_KEY`（Functions）       | 組織ドキュメントに `buildicsApiKey` が無いときの **共通フォールバック**（BUILDICS プロキシ） |
| `LOGO_URL_ALLOWED_HOSTS`（Functions） | ロゴ `logoUrl` の追加許可ホスト（カンマ区切り。任意）                               |
| `VITE_DEFAULT_ORG_SLUG`（Frontend）   | `/` アクセス時の `Navigate` 先 `/tenant/<slug>`                       |


## 静的 `public/config/facilities.json`

テナント非対応の最終フォールバックです。本番では BFF の `/api/public/config?orgSlug=...` が成功することを前提にしてください。