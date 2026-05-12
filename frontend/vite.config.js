import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = readFileSync(resolve(__dirname, '../VERSION'), 'utf8').trim();

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: [
        'pwa-icon.svg',
        'pwa-192.png',
        'pwa-512.png',
        'apple-touch-icon.png',
        'config/facilities.json',
      ],
      manifest: {
        name: 'WBGT 熱中症監視',
        short_name: '熱中症監視',
        description: 'BUILDICS 連携の WBGT（暑さ指数）モニタリング',
        theme_color: '#0f172a',
        background_color: '#f1f5f9',
        display: 'standalone',
        display_override: ['standalone', 'browser'],
        orientation: 'any',
        scope: '/',
        start_url: '/',
        lang: 'ja',
        dir: 'ltr',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
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
