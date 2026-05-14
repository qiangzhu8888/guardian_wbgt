import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testsDir, '../../..');

/** @returns {string} */
function readRepoVersion() {
  return readFileSync(join(repoRoot, 'VERSION'), 'utf8').trim();
}

/** 公開ドキュメント（更新履歴・マニュアル）の受入：ビルド済み SPA + 静的 JSON フォールバックで確認 */
test.describe('公開ドキュメント', () => {
  test('更新履歴に VERSION と整合する先頭リリースが表示される', async ({ page }) => {
    const version = readRepoVersion();
    const versionRe = new RegExp(`v${version.replace(/\./g, '\\.')}`);
    await page.goto('/changelog');
    await expect(page.getByRole('heading', { name: /^v\d+\.\d+\.\d+/ }).first()).toBeVisible({ timeout: 30_000 });
    const banner = await page.locator('header').textContent();
    expect(banner || '').toMatch(versionRe);
    await expect(page.getByText('監視 UI・参照予報の読みやすさ')).toBeVisible();
    await expect(page.getByText('日本気象協会').first()).toBeVisible();
  });

  test('管理マニュアルにセンサーと JWA・ダッシュボード運用の説明がある', async ({ page }) => {
    await page.goto('/manual');
    await expect(page.getByRole('heading', { name: '管理コンソール操作マニュアル' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('現場センサーに基づく現在の WBGT（暑さ指数の推定値）')).toBeVisible();
    await expect(page.getByText('気象庁の地域ヒート注意情報はダッシュボードのカードには出しません')).toBeVisible();
    await expect(page.getByText('58px')).toBeVisible();
  });
});
