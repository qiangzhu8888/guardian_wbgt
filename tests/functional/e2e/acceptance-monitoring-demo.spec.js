import { expect, test } from '@playwright/test';

/**
 * 公開監視 `/tenant/default`（設定は API または `/config/facilities.json` フォールバック）。
 * 先に `frontend` で `npm run build` が実行されていることを前提。
 */
test.describe('監視デモ（静的フォールバック）', () => {
  test('モック施設カードで「現在の WBGT（デモ）」が見える', async ({ page }) => {
    await page.goto('/tenant/default');
    await expect(page.getByText('現在の WBGT（デモ）').first()).toBeVisible({ timeout: 45_000 });
  });

  test('現在の WBGT（デモ）のカードから詳細を開ける', async ({ page }) => {
    await page.goto('/tenant/default');
    const demoCard = page.getByRole('button').filter({ hasText: '現在の WBGT（デモ）' }).first();
    await expect(demoCard).toBeVisible();
    await demoCard.click();
    await expect(page.getByText('WBGT 暑さ指数（デモ）')).toBeVisible();
    await expect(page.getByRole('button', { name: '← 戻る' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /時間別履歴/ })).toBeVisible();
  });
});
