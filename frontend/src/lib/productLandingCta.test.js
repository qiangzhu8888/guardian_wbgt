import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  productLandingCtaPaths,
  ADMIN_LOGIN_PATH,
  PRODUCT_LANDING_PATH,
  CHANGELOG_PATH,
  MANUAL_PATH,
  TERMS_PATH,
  PRIVACY_PATH,
  SLIDES_PATH,
} from './productLandingCta';
import { monitorHomePath } from './orgRoute';

describe('productLandingCta', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DEFAULT_ORG_SLUG', 'acme-corp');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns monitor path aligned with default org slug', () => {
    const { monitorPath } = productLandingCtaPaths();
    expect(monitorPath).toBe(monitorHomePath('acme-corp'));
    expect(monitorPath).toBe('/tenant/acme-corp');
  });

  it('exposes fixed admin, product, docs paths', () => {
    const {
      adminLoginPath,
      productPath,
      changelogPath,
      manualPath,
      termsPath,
      privacyPath,
      slidesPath,
    } = productLandingCtaPaths();
    expect(adminLoginPath).toBe(ADMIN_LOGIN_PATH);
    expect(adminLoginPath).toBe('/admin/login');
    expect(productPath).toBe(PRODUCT_LANDING_PATH);
    expect(productPath).toBe('/');
    expect(changelogPath).toBe(CHANGELOG_PATH);
    expect(changelogPath).toBe('/changelog');
    expect(manualPath).toBe(MANUAL_PATH);
    expect(manualPath).toBe('/manual');
    expect(termsPath).toBe(TERMS_PATH);
    expect(termsPath).toBe('/terms');
    expect(privacyPath).toBe(PRIVACY_PATH);
    expect(privacyPath).toBe('/privacy');
    expect(slidesPath).toBe(SLIDES_PATH);
    expect(slidesPath).toBe('/slides');
  });
});
