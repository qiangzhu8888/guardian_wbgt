import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testsDir, '../../..');

/** @type {Record<string, unknown>} */
const staticFallbackConfig = JSON.parse(
  readFileSync(join(repoRoot, 'frontend/public/config/facilities.json'), 'utf8'),
);

/**
 * 公開 API が動いている環境でも、静的フォールバック（isMock 施設）だけを使う。
 * @param {import('@playwright/test').Page} page
 */
async function useStaticMonitorConfig(page) {
  await page.route('**/api/public/config**', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' }),
  );
  await page.route('**/api/buildics**', (route) =>
    route.fulfill({ status: 502, contentType: 'text/plain', body: 'blocked in static demo e2e' }),
  );
  await page.route('**/config/facilities.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(staticFallbackConfig),
    }),
  );
}

/**
 * 公開監視 `/tenant/default`（静的 `/config/facilities.json` フォールバック）。
 * 先に `frontend` で `npm run build` が実行されていることを前提。
 */
test.describe('監視デモ（静的フォールバック）', () => {
  test.beforeEach(async ({ page }) => {
    await useStaticMonitorConfig(page);
  });

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
    await expect(page.getByTestId('detail-hourly-heading')).toBeVisible();
  });
});
