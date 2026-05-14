---
name: wbgt-jwa-api
description: 日本気象協会（JWA）の暑さ指数（WBGT）APIを使って予測・実況データを取得するアプリを実装するためのルール。ユーザーが WBGT、暑さ指数、熱中症指数、jpmesh、/v3/jpmesh/wbgt/ で始まるエンドポイント、予測・実況・日別・時別データに言及した場合に適用する。
---

# 日本気象協会 WBGT API

Premium プランのみ利用可能。1km メッシュで WBGT データを提供。

## ベースURL・認証

- ベースURL: `https://api.jwa.or.jp`
- 認証方式: **リクエストヘッダーに 2 つのキーを同時に付与する**

| ヘッダー名 | 環境変数 | 説明 |
|---|---|---|
| `X-api-key` | `JWA_X_API_KEY` | 第1認証キー |
| `Apikey`    | `JWA_APIKEY`    | 第2認証キー |

> **注意**: `Authorization: Bearer` は使わない。`X-api-key` と `Apikey` の 2 ヘッダーが必須。
> どちらか一方だけでも 401 になる可能性があるため、必ず両方を付与すること。

### 環境変数の設定例

```bash
# PowerShell
$env:JWA_X_API_KEY = "X-api-key の値"
$env:JWA_APIKEY    = "Apikey の値"

# bash
export JWA_X_API_KEY="X-api-key の値"
export JWA_APIKEY="Apikey の値"
```

## エンドポイント一覧

### 予測（日別）— 最大 8 日間

```
GET /v3/jpmesh/wbgt/forecasts/daily/point/{lat,lon}.json
GET /v3/jpmesh/wbgt/forecasts/daily/postcode/{postcode}.json
GET /v3/jpmesh/wbgt/forecasts/daily/meshcode/{meshcode}.json
```

レスポンス `data` 配列の各要素:

| フィールド | 型 | 説明 |
|---|---|---|
| `date` | string (`yyyy-mm-dd`) | 日付 |
| `max_wbgt` | number (0.1℃単位) | 最高 WBGT |
| `min_wbgt` | number (0.1℃単位) | 最低 WBGT |
| `rank` | 0–4 | 暑さ指数ランク |

### 予測（時別）— 約 73 件（0〜2 日先 1 時間間隔）

```
GET /v3/jpmesh/wbgt/forecasts/hourly/point/{lat,lon}.json
GET /v3/jpmesh/wbgt/forecasts/hourly/postcode/{postcode}.json
GET /v3/jpmesh/wbgt/forecasts/hourly/meshcode/{meshcode}.json
```

レスポンス `data` 配列の各要素:

| フィールド | 型 | 説明 |
|---|---|---|
| `time` | string (ISO 8601) | 時刻（JST） |
| `wbgt` | number (0.1℃単位) | WBGT 値 |
| `rank` | 0–4 | 暑さ指数ランク |

### 実況（時別）— 2020-01-01 以降、1 日 12 件

```
GET /v3/jpmesh/wbgt/observations/hourly/point/{lat,lon}/time/{time}.json
GET /v3/jpmesh/wbgt/observations/hourly/postcode/{postcode}/time/{time}.json
GET /v3/jpmesh/wbgt/observations/hourly/meshcode/{meshcode}/time/{time}.json
```

`time` パラメータ: `yyyymmdd`（日指定）または `yyyymm`（月指定）

### 実況（日別）— 2020-01-01 以降

```
GET /v3/jpmesh/wbgt/observations/daily/point/{lat,lon}/time/{time}.json
GET /v3/jpmesh/wbgt/observations/daily/postcode/{postcode}/time/{time}.json
GET /v3/jpmesh/wbgt/observations/daily/meshcode/{meshcode}/time/{time}.json
```

`time` パラメータ: `yyyymmdd`（日指定）または `yyyymm`（月指定）

## 場所指定パラメータ

| 種類 | 形式 | 例 |
|---|---|---|
| `point` | `緯度,経度` | `35.68944,139.69167` |
| `postcode` | `xxx-xxxx`（ハイフン付き） | `170-6055` |
| `meshcode` | JIS メッシュコード | `59403230` |

## 共通レスポンス構造

```json
{
  "metadata": {
    "author": "Japan Weather Association",
    "title": "jp_mesh_wbgt_daily_forecasts",
    "parameter": { "point": "35.6839,139.7744", "format": "json" },
    "resultset": { "count": 8 }
  },
  "results": {
    "mesh_code": "53394621",
    "reference_time": "2025-06-20T10:00:00+09:00",
    "initial_time": "2025-06-20T11:00:00+09:00",
    "time_zone": "jst",
    "elevation": "4.8",
    "data": [ /* ... */ ]
  }
}
```

- 予測系のみ `reference_time`・`initial_time` が含まれる
- 実況系には含まれない

## rank の意味

| rank | 意味 |
|---|---|
| 0 | ほぼ安全 |
| 1 | 注意 |
| 2 | 警戒 |
| 3 | 厳重警戒 |
| 4 | 危険 |

## エラーレスポンス

```json
{ "error": { "code": 40004, "title": "エラー名", "detail": "詳細" } }
```

| HTTP | code | 備考 |
|---|---|---|
| 401 | — | 認証失敗（ヘッダー不正・キー誤り）。JSON ではなく空またはプレーンテキストで返る場合あり |
| 400 | 40001–40009 | パラメータ不正 |
| 404 | 40401 | URL 不正 |
| 500 | 50001 | サーバーエラー |

## 実装例（TypeScript/fetch）

```typescript
const BASE_URL = "https://api.jwa.or.jp";

// 認証ヘッダーを組み立てる（X-api-key と Apikey の両方が必要）
function getAuthHeaders(): Record<string, string> {
  const xApiKey = process.env.JWA_X_API_KEY;
  const apiKey  = process.env.JWA_APIKEY;

  if (!xApiKey || !apiKey) {
    throw new Error(
      "JWA_X_API_KEY と JWA_APIKEY の両方を環境変数に設定してください"
    );
  }

  return {
    "X-api-key":    xApiKey,
    "Apikey":       apiKey,
    "Content-Type": "application/json;charset=UTF-8",
  };
}

async function fetchWbgtForecastDaily(lat: number, lon: number) {
  const url = `${BASE_URL}/v3/jpmesh/wbgt/forecasts/daily/point/${lat},${lon}.json`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`WBGT API error: ${err.error?.code} ${err.error?.title}`);
  }
  return res.json();
}

async function fetchWbgtObservationHourly(lat: number, lon: number, date: string) {
  // date: yyyymmdd または yyyymm
  const url = `${BASE_URL}/v3/jpmesh/wbgt/observations/hourly/point/${lat},${lon}/time/${date}.json`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`WBGT API error: ${err.error?.code} ${err.error?.title}`);
  }
  return res.json();
}
```

## 実装上の注意点

- `point` パラメータは URL パスに埋め込む（クエリパラメータではない）
- `postcode` はハイフンあり形式（`1700000` ではなく `170-0000`）
- WBGT 値は 0.1℃単位の数値（表示時は `value / 10` で℃に変換）
- `rank` が `null` の場合あり（データなし）—必ず null チェックを行う
- 実況データの提供開始は 2020-01-01 以降
- 401 エラーのレスポンスボディは API 仕様の JSON 形式ではない場合があるため、`res.json()` ではなく `res.text()` で受けてからデバッグすること
