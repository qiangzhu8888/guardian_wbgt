/** ビルド時に Vite（`vite.config.js` の `define`）が `../VERSION` から注入 */
export function getAppReleaseVersion() {
  return typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__).trim() : '';
}
