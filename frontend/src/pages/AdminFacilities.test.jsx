import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/authSession', () => ({
  adminApiFetch: vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    }),
  ),
  clearAuthSession: vi.fn(),
  getAuthUser: () => ({
    role: 'admin',
    email: 'a@example.com',
    orgId: '1',
    orgs: [{ orgId: '1', orgSlug: 'test-org' }],
  }),
  requestAdminLogout: vi.fn(() => Promise.resolve()),
}));

vi.mock('../components/FacilityLocationMapPicker', () => ({
  default: () => null,
}));

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AdminFacilities from './AdminFacilities.jsx';

describe('AdminFacilities', () => {
  it('リスト下に「手順 2」デバイス紐付けへの導線を表示する', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdminFacilities />
      </MemoryRouter>,
    );
    expect(html).toContain('次のステップ（手順 2）');
    expect(html).toContain('href="/admin/devices"');
    expect(html).toContain('デバイス紐付け');
  });
});
