import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/authSession', () => ({
  adminApiFetch: vi.fn((url) => {
    if (String(url).includes('/devices')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          data: [],
          demoDeviceIds: ['350976658106130'],
        }),
      });
    }
    if (String(url).includes('/facilities')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ facilityId: 1, name: 'テスト場所', sortOrder: 0, disabled: false }] }),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  }),
  clearAuthSession: vi.fn(),
  getAuthUser: () => ({
    role: 'admin',
    email: 'a@example.com',
    orgId: '1',
    orgs: [{ orgId: '1', orgSlug: 'test-org' }],
  }),
  requestAdminLogout: vi.fn(() => Promise.resolve()),
}));

vi.mock('../components/DeviceIdQrScannerModal', () => ({
  default: () => null,
}));

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AdminDevices from './AdminDevices.jsx';

describe('AdminDevices', () => {
  it('台帳一覧下に場所マスタへの「場所を登録」を表示する', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdminDevices />
      </MemoryRouter>,
    );
    expect(html).toContain('監視地点（手順 1）');
    expect(html).toContain('href="/admin/facilities"');
    expect(html).toContain('場所を登録');
  });

  it('一覧ヘッダに紐付け解除の操作列がある', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdminDevices />
      </MemoryRouter>,
    );
    expect(html).toContain('紐付け解除');
    expect(html).toContain('操作');
    expect(html).toContain('種別');
    expect(html).toContain('ダッシュボード表示');
  });
});
