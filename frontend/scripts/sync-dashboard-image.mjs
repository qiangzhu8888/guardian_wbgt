/**
 * リポジトリ直下の images/dashboard.png を public に複製（製品 LP 用）。
 * ソースが無い場合はスキップ（既存の public ファイルをそのまま使う）。
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, '..');
const repoRoot = join(frontendRoot, '..');
const src = join(repoRoot, 'images', 'dashboard.png');
const destDir = join(frontendRoot, 'public', 'images');
const dest = join(destDir, 'dashboard.png');

if (!existsSync(src)) {
  console.warn('[sync-dashboard-image] skip (source missing):', src);
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log('[sync-dashboard-image] copied → public/images/dashboard.png');
