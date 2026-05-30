import { expect, test } from '@playwright/test';

/** 管理 API は route モックのため JWT 検証は行われない（実トークン不要） */
function makeAdminSession() {
  const token = 'e2e-mock-admin-token';
  const user = {
    id: 'e2e-admin',
    email: 'e2e@example.com',
    role: 'admin',
    orgId: 'default',
    orgSlug: 'default',
    orgs: [{ orgId: 'default', orgSlug: 'default' }],
  };
  return { token, user };
}

const mockDevices = [
  {
    deviceId: '350976658106130',
    orgId: 'default',
    facilityId: 1,
    label: 'センサーA',
    disabled: false,
    dashboardDisplay: true,
    facilitySiblingCount: 2,
    dashboardDisplayEffective: true,
    sourceKind: 'demo',
  },
  {
    deviceId: '350976658106131',
    orgId: 'default',
    facilityId: 1,
    label: 'センサーB',
    disabled: false,
    dashboardDisplay: false,
    facilitySiblingCount: 2,
    dashboardDisplayEffective: false,
    sourceKind: 'demo',
  },
];

const mockFacilities = [
  { facilityId: 1, name: '校庭', sortOrder: 0, disabled: false },
];

test.describe('管理コンソール（API モック受入）', () => {
  test.beforeEach(async ({ page }) => {
    const { token, user } = makeAdminSession();
    await page.addInitScript(
      ({ t, u }) => {
        sessionStorage.setItem('accessToken', t);
        sessionStorage.setItem('authUser', JSON.stringify(u));
      },
      { t: token, u: user },
    );

    await page.route('**/api/admin/devices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: mockDevices,
            demoDeviceIds: ['350976658106130'],
          }),
        });
        return;
      }
      if (route.request().method() === 'PATCH') {
        const url = route.request().url();
        const body = route.request().postDataJSON();
        if (body?.dashboardDisplay === true) {
          const id = decodeURIComponent(url.split('/devices/')[1] || '');
          for (const row of mockDevices) {
            row.dashboardDisplay = row.deviceId === id;
            row.dashboardDisplayEffective = row.deviceId === id;
          }
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200 }),
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/admin/facilities', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: mockFacilities }),
        });
        return;
      }
      await route.continue();
    });
  });

  test('デバイス台帳でダッシュボード表示の切替 UI が動作する', async ({ page }) => {
    await page.goto('/admin/devices');
    await expect(page.getByRole('heading', { name: 'デバイス台帳' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('ダッシュボード表示').first()).toBeVisible();

    await expect(page.getByText('表示中').first()).toBeVisible();
    const switchBtn = page.getByRole('button', { name: '表示に使う' });
    await expect(switchBtn).toBeVisible();
    await switchBtn.click();

    await expect(page.getByText('表示中')).toHaveCount(1);
    await expect(page.getByRole('button', { name: '表示に使う' })).toHaveCount(1);
  });
});

test.describe('組織設定 BUILDICS 通信テスト（API モック受入）', () => {
  test.beforeEach(async ({ page }) => {
    const { token, user } = makeAdminSession();
    await page.addInitScript(
      ({ t, u }) => {
        sessionStorage.setItem('accessToken', t);
        sessionStorage.setItem('authUser', JSON.stringify(u));
      },
      { t: token, u: user },
    );

    await page.route('**/api/admin/org-settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            data: {
              orgId: 'default',
              slug: 'default',
              buildicsApiKeyConfigured: false,
              buildicsApiKeyLast4: null,
              dashboardTitle: '',
              dashboardSubtitle: '',
              themePrimary: '',
              logoUrl: '',
              pollingIntervalMs: null,
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/admin/org-settings/buildics-test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          ok: true,
          status: 'ok',
          message: 'BUILDICS API への接続に成功しました。',
          keySource: 'input',
        }),
      });
    });
  });

  test('BUILDICS API キー入力後に通信テストできる', async ({ page }) => {
    await page.goto('/admin/org-settings');
    await expect(page.getByRole('heading', { name: '組織設定' })).toBeVisible({ timeout: 30_000 });

    await page.getByPlaceholder('新しいキーを入力').fill('test-buildics-key');
    await page.getByRole('button', { name: '通信テスト' }).click();

    await expect(page.getByText('BUILDICS API への接続に成功しました')).toBeVisible();
    await expect(page.getByText('（入力中のキー）')).toBeVisible();
  });
});
