import { defaultOrgSlug, monitorHomePath } from './orgRoute';

export const ADMIN_LOGIN_PATH = '/admin/login';
export const PRODUCT_LANDING_PATH = '/';
export const CHANGELOG_PATH = '/changelog';
export const MANUAL_PATH = '/manual';
export const TERMS_PATH = '/terms';
export const PRIVACY_PATH = '/privacy';
export const SLIDES_PATH = '/slides';
export const SPECS_PATH = '/specs';
export const NOTIFICATIONS_PATH = '/notifications';

/** ランディング CTA 用の内部ルート（既定組織スラッグは `VITE_DEFAULT_ORG_SLUG`） */
export function productLandingCtaPaths() {
  return {
    monitorPath: monitorHomePath(defaultOrgSlug()),
    adminLoginPath: ADMIN_LOGIN_PATH,
    productPath: PRODUCT_LANDING_PATH,
    changelogPath: CHANGELOG_PATH,
    manualPath: MANUAL_PATH,
    notificationsPath: NOTIFICATIONS_PATH,
    termsPath: TERMS_PATH,
    privacyPath: PRIVACY_PATH,
    slidesPath: SLIDES_PATH,
    specsPath: SPECS_PATH,
  };
}
