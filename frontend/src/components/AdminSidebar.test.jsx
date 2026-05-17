import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';

describe('AdminSidebar', () => {
  it('一般管理者にセットアップ手順と組織設定を一覧する（PF 項目なし）', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/facilities']}>
        <AdminSidebar variant="dock" role="admin" />
      </MemoryRouter>,
    );
    expect(html).toContain('href="/admin"');
    expect(html).toContain('href="/admin/org-settings"');
    expect(html).toContain('場所を追加・編集');
    expect(html).toContain('デバイス紐付け');
    expect(html).not.toContain('/admin/platform/orgs');
  });

  it('superadmin にはプラットフォーム項目を一覧する', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdminSidebar variant="dock" role="superadmin" />
      </MemoryRouter>,
    );
    expect(html).toContain('href="/admin/platform/orgs"');
  });
});
