import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = readFileSync(resolve(__dirname, '../VERSION'), 'utf8').trim();

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
  server: {
    proxy: {
      '/buildics-api': {
        target: 'https://www.buildics.jp/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/buildics-api/, ''),
        secure: true,
      },
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (path) => `/wgbt-monitor/asia-northeast1/api${path}`,
      },
    },
  },
});
