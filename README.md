# WBGT 監視アプリ（sigmaTop_WBGT）

BUILDICS® のセンサーデータを取得し、暑さ指数（WBGT）を推定して施設単位で可視化する Web アプリです。フロントは **Vite + React**、バックエンドは **Firebase Hosting + Cloud Functions（BFF）**、認証は **自前 JWT（Access / Refresh）**、デバイス台帳は **Firestore** で管理します。

## 主な機能

- ダッシュボード・施設詳細・モバイル向けプレビュー
- 公開設定の取得（`/api/public/config`）と静的フォールバック（`frontend/public/config/facilities.json`）
- BUILDICS API のプロキシ（`/api/buildics`、パスホワイトリスト・JSON サイズ制限・台帳に基づく `deviceId` スコープ検証）
- 管理者向けデバイス台帳（`/admin/devices` と `GET/POST/PATCH/DELETE` / `bulk` API）
- 監査ログ（デバイス作成・一括登録・更新・論理削除を `auditLogs` に記録）

## 必要条件

- **Node.js 22.x**
- **Firebase CLI**（デプロイ・エミュレータ）
- BUILDICS API キー（開発で直叩きする場合）

## ディレクトリ構成（抜粋）


| パス                | 説明                                             |
| ----------------- | ---------------------------------------------- |
| `frontend/`       | React SPA（Vite）                                |
| `functions/`      | Cloud Functions（Express ベースの BFF）              |
| `firebase.json`   | Hosting（`frontend/dist`）と `/api/`** → `api` 関数 |
| `firestore.rules` | クライアントは原則拒否（アクセスは Functions 経由）                |
| `DEPLOY.md`       | 本番デプロイ・シークレット・bootstrap の詳細                    |
| `VERSION`         | フッター表示用のバージョン文字列                               |
| `test-api.cjs`    | BUILDICS 直結の接続確認（`BUILDICS_API_KEY` 必須）        |


## セットアップ

```bash
cd frontend && npm ci
cd ../functions && npm ci
```

環境変数のひな形:

- `frontend/.env.example`
- `functions/.env.example`

実値の `.env` / `.env.local` はリポジトリにコミットしないでください。

## ローカル開発

1. **Functions + Firestore エミュレータ**（リポジトリルート）
  初回のみエミュレータ定義の対話セットアップが必要なら、ルートで `firebase init emulators` を実行してください（`firebase.json` に `emulators` がある場合はスキップ可）。
   **PowerShell** では `--only` を **引用符で囲む**必要があります。初回管理者は `functions/.env` に `AUTH_BOOTSTRAP_SECRET` と `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` を設定し、`cd functions && npm run seed:admin` で登録できます（[DEPLOY.md](./DEPLOY.md)）。
2. **フロント**（別ターミナル）
  ```bash
   cd frontend && npm run dev
  ```
   Vite の `/api` プロキシは `.firebaserc` の **default プロジェクト ID**（例: `wgbt-monitor`）と整合する URL に転送されます。プロジェクト ID を変えた場合は `frontend/vite.config.js` の `rewrite` を合わせてください。
3. **BUILDICS をブラウザから直接叩く開発**
  `VITE_BUILDICS_API_KEY` と `vite` の `/buildics-api` プロキシを利用する方式です。詳細は `frontend/.env.example` を参照してください。

## テスト

```bash
cd frontend && npm test
cd ../functions && npm test
```

CI（`main` 向け）は `.github/workflows/ci.yml` で `frontend` の `build` / `test` と `functions` の `test` を実行します。

## 本番ビルドとデプロイ

```bash
cd frontend && npm ci && npm run build
cd ../functions && npm ci
firebase deploy --only "firestore,functions,hosting"
```

シークレット・初回管理者作成・台帳とプロキシの関係は **[DEPLOY.md](./DEPLOY.md)** にまとめています。

## API の概要（BFF）


| メソッド                        | パス                        | 備考                                                 |
| --------------------------- | ------------------------- | -------------------------------------------------- |
| GET                         | `/api/public/config`      | 公開設定（Firestore の台帳で `deviceMappings` を上書き可能）       |
| POST                        | `/api/auth/login`         | メール・パスワード → Access Token、Refresh は httpOnly Cookie |
| POST                        | `/api/auth/refresh`       | Cookie の Refresh から Access 再発行                     |
| POST                        | `/api/auth/logout`        | Refresh Cookie 削除                                  |
| POST                        | `/api/auth/bootstrap`     | 初回管理者作成（`X-Bootstrap-Secret` 必須・ユーザー 0 件時のみ）       |
| GET / POST / PATCH / DELETE | `/api/admin/devices` 等    | **role: admin** のみ                                 |
| POST                        | `/api/admin/devices/bulk` | 最大 100 件の一括登録                                      |
| POST                        | `/api/buildics?path=...`  | BUILDICS へのプロキシ（許可パスのみ）                            |


## セキュリティの注意

- **秘密鍵・API キー・パスワードをクライアントやリポジトリに含めない**（`NEXT_PUBLIC_` / `VITE_` にシークレットを載せない）。
- 本番では `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`（または `JWT_SECRET`）と `ALLOWED_ORIGINS` を必ず設定する（エミュレータ専用の JWT フォールバックは本番では使われない）。
- Firestore は Rules でクライアント直接アクセスを拒否し、データ変更は Functions 経由に限定する想定です。

## ライセンス・商標

- BUILDICS は株式会社テクサー（BUILDICS®）のサービスです。利用条件は同社の契約・ドキュメントに従ってください。

