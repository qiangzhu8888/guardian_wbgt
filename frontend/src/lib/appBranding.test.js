import { describe, it, expect } from 'vitest';
import { APP_DISPLAY_NAME, DEFAULT_APP_LOGO_URL, PRODUCTION_COMPANY_NAME } from './appBranding';

describe('appBranding', () => {
  it('APP_DISPLAY_NAME は製品表記を固定する', () => {
    expect(APP_DISPLAY_NAME).toBe('熱中症監視システム BUILDICS-GUARDIAN');
  });

  it('PRODUCTION_COMPANY_NAME は制作クレジット用の社名を固定する', () => {
    expect(PRODUCTION_COMPANY_NAME).toBe('株式会社テクサー');
  });

  it('DEFAULT_APP_LOGO_URL は公開パスを指す', () => {
    expect(DEFAULT_APP_LOGO_URL).toBe('/images/logo.png');
  });
});
