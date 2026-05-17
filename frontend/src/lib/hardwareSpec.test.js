import { describe, it, expect } from 'vitest';
import { HARDWARE_SPEC_SECTIONS } from './hardwareSpec';

describe('hardwareSpec', () => {
  it('カテゴリと項目から主要スペックを読み取れる', () => {
    expect(HARDWARE_SPEC_SECTIONS.length).toBeGreaterThan(0);

    const first = HARDWARE_SPEC_SECTIONS[0];
    expect(first.rows.some((r) => r.detail.includes('146mm'))).toBe(true);
    expect(first.rows.some((r) => r.detail.includes('IP67'))).toBe(true);

    const comm = HARDWARE_SPEC_SECTIONS.find((s) => s.category.includes('通信'));
    expect(comm).toBeDefined();
    expect(comm.rows.some((r) => r.detail.includes('LTE'))).toBe(true);
    expect(comm.rows.some((r) => r.detail.includes('NB-IoT'))).toBe(true);

    const sns = HARDWARE_SPEC_SECTIONS.find((s) => s.category === 'センサー');
    expect(sns?.rows.some((r) => r.detail.includes('温湿度'))).toBe(true);

    const other = HARDWARE_SPEC_SECTIONS.find((s) => s.category === 'その他');
    expect(other?.rows.some((r) => r.item.includes('認証') && r.detail.includes('TELEC'))).toBe(true);
  });
});
