/**
 * PNG アイコンを生成（P / manifest / Apple Touch Icon 用）。
 * public/pwa-icon.svg を変更したあとに再実行: npm run generate:pwa-icons
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

function compositeSimpleIcon(size) {
  const png = new PNG({ width: size, height: size, colorType: 6 });
  const r = Math.round(0.21 * size);
  const bg = { r: 15, g: 23, b: 42, a: 255 };
  const accent = { r: 56, g: 189, b: 248, a: 255 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2;
      const ix = x - size / 2;
      const iy = y - size / 2;
      const dist = Math.sqrt(ix * ix + iy * iy);
      const inRound = dist <= size / 2 - 2;

      if (!inRound) {
        png.data[i] = 0;
        png.data[i + 1] = 0;
        png.data[i + 2] = 0;
        png.data[i + 3] = 0;
        continue;
      }

      const body =
        x > size * 0.35 &&
        x < size * 0.65 &&
        y > size * 0.22 &&
        y < size * 0.72;
      const bulb = dist < size * 0.08 && y > size * 0.62;

      if (bulb) {
        png.data[i] = 249;
        png.data[i + 1] = 115;
        png.data[i + 2] = 54;
        png.data[i + 3] = 255;
      } else if (body) {
        png.data[i] = accent.r;
        png.data[i + 1] = accent.g;
        png.data[i + 2] = accent.b;
        png.data[i + 3] = 255;
      } else {
        png.data[i] = bg.r;
        png.data[i + 1] = bg.g;
        png.data[i + 2] = bg.b;
        png.data[i + 3] = 255;
      }
    }
  }

  return PNG.sync.write(png);
}

for (const size of [180, 192, 512]) {
  const buf = compositeSimpleIcon(size);
  const name =
    size === 180 ? 'apple-touch-icon.png' : size === 192 ? 'pwa-192.png' : 'pwa-512.png';
  writeFileSync(join(publicDir, name), buf);
}

console.log('Wrote apple-touch-icon.png, pwa-192.png, pwa-512.png');
