import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/buildics-api': {
        target: 'https://www.buildics.jp/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/buildics-api/, ''),
        secure: true,
      },
    },
  },
})
