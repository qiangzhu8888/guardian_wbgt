import { describe, it, expect } from 'vitest';
import { APP_DISPLAY_NAME, DEFAULT_APP_LOGO_URL } from './appBranding';

describe('appBranding', () => {
  it('APP_DISPLAY_NAME は製品表記を固定する', () => {
    expect(APP_DISPLAY_NAME).toBe('熱中症監視システム BUILDICS-GUARDIAN');
  });

  it('DEFAULT_APP_LOGO_URL は公開パスを指す', () => {
    expect(DEFAULT_APP_LOGO_URL).toBe('/images/logo.png');
  });
});
