/**
 * 更新履歴（新しい版を上に追加し、先頭の version はリポジトリ直下の VERSION と一致させる）
 * @typedef {{ version: string, date: string, title?: string, items: string[] }} ReleaseNoteEntry
 */

/** @type {ReleaseNoteEntry[]} */
export const RELEASE_NOTES = [
  {
    version: '0.1.1',
    date: '2026-05-14',
    title: '運用調整・PWA・ドキュメント',
    items: [
      '公開監視ダッシュボードで「1時間後の WBGT」予測表示を終了し、現在の観測値を中心に表示',
      'PWA／ホーム画面追加の案内バナーを追加（ブラウザのインストールプロンプトに対応。閉じると一定期間非表示／管理コンソールでは非表示）',
      '複数組織に所属する管理者向けの組織切り替え（ヘッダー）とプラットフォーム側のユーザー所属編集 UI の運用説明を管理マニュアルに追記',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-05-13',
    title: 'ベースライン',
    items: [
      '施設単位の WBGT（暑さ指数）監視ダッシュボード・施設詳細・モバイル向け表示',
      '管理コンソール（組織設定、監視地点「場所」の登録、デバイス台帳と紐付け、一括取り込み）',
      'BUILDICS® API 連携（ホワイトリスト・サイズ制限・台帳に基づく deviceId スコープ）',
      '公開設定 API と静的フォールバック、監査ログ（台帳操作の記録）',
      '製品案内（/product）、更新履歴（/changelog）、管理マニュアル（/manual）',
    ],
  },
];

/** @returns {string} */
export function getLatestReleaseNoteVersion() {
  return RELEASE_NOTES.length ? RELEASE_NOTES[0].version : '';
}
