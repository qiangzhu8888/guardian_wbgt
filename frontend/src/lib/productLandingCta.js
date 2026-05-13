import { defaultOrgSlug, monitorHomePath } from './orgRoute';

export const ADMIN_LOGIN_PATH = '/admin/login';
export const PRODUCT_LANDING_PATH = '/product';
export const CHANGELOG_PATH = '/changelog';
export const MANUAL_PATH = '/manual';

/** ランディング CTA 用の内部ルート（既定組織スラッグは `VITE_DEFAULT_ORG_SLUG`） */
export function productLandingCtaPaths() {
  return {
    monitorPath: monitorHomePath(defaultOrgSlug()),
    adminLoginPath: ADMIN_LOGIN_PATH,
    productPath: PRODUCT_LANDING_PATH,
    changelogPath: CHANGELOG_PATH,
    manualPath: MANUAL_PATH,
  };
}
