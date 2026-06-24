import { isUsableFacilityLatLng } from './geoFormat';

/**
 * 施設座標の状態（API 呼び出し前の説明用）
 * @param {unknown} lat
 * @param {unknown} lng
 * @returns {{ kind: 'ok' | 'missing' | 'unset_zero' | 'invalid', title: string, message: string }}
 */
export function describeFacilityCoordsIssue(lat, lng) {
  const latStr = lat === null || lat === undefined ? '' : String(lat).trim();
  const lngStr = lng === null || lng === undefined ? '' : String(lng).trim();
  if (latStr === '' || lngStr === '') {
    return {
      kind: 'missing',
      title: '緯度・経度が未登録',
      message:
        '管理画面の施設マスタで緯度・経度を設定すると、付近の WBGT 予測（JWA）や気象庁の熱中症警戒アラート（参考）が表示されます。',
    };
  }

  const la = Number(latStr);
  const ln = Number(lngStr);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return {
      kind: 'missing',
      title: '緯度・経度が未登録',
      message:
        '管理画面の施設マスタで緯度・経度を設定すると、付近の WBGT 予測（JWA）や気象庁の熱中症警戒アラート（参考）が表示されます。',
    };
  }

  if (Math.abs(la) < 1e-9 && Math.abs(ln) < 1e-9) {
    return {
      kind: 'unset_zero',
      title: '緯度・経度が 0,0 のまま',
      message:
        '初期値の 0,0 は未設定とみなされます。管理画面で「住所から取得」または地図ピッカーで位置を指定してください（住所は3文字以上、例: 東京都町田市）。',
    };
  }

  if (!isUsableFacilityLatLng(la, ln)) {
    return {
      kind: 'invalid',
      title: '緯度・経度が不正',
      message: `登録値（${la}, ${ln}）は利用できません。施設マスタの緯度・経度を見直してください。`,
    };
  }

  return { kind: 'ok', title: '', message: '' };
}

/**
 * 公開 API の HTTP エラーを利用者向けに整形
 * @param {number} status
 * @param {string} [msg]
 * @param {'jwa'|'jma'|string} [context]
 * @returns {string}
 */
export function formatPublicApiError(status, msg, context = '') {
  const raw = typeof msg === 'string' && msg.trim() ? msg.trim() : '';
  if (status === 503) {
    return raw || 'WBGT 予測 API が未設定です。管理者に API キーの設定を依頼してください。';
  }
  if (status === 400) {
    if (raw.includes('0,0') || raw.includes('未設定')) return raw;
    if (/lat|lon|lng|緯度|経度/i.test(raw)) {
      return raw || '緯度・経度が不正です。施設マスタを確認してください。';
    }
  }
  if (status === 422) {
    return raw.includes('逆ジオ')
      ? raw
      : `地点の都道府県判定に失敗しました。${raw || '緯度・経度が日本国内か確認してください。'}`;
  }
  if (status === 502 && context === 'jwa') {
    return `日本気象協会（JWA）API の取得に失敗しました。${raw || 'しばらくしてから再試行してください。'}`;
  }
  if (status === 502 && context === 'jma') {
    return `気象庁参照情報の取得に失敗しました。${raw || 'しばらくしてから再試行してください。'}`;
  }
  return raw || `サーバーエラー（HTTP ${status}）`;
}
