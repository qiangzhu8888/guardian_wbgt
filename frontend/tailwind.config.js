/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        /** マーケ LP 用・控えめなドット格子（Neutral / Stitch 系のトーン参照） */
        'landing-dot':
          'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.22) 1px, transparent 0)',
        'landing-dot-dark':
          'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.12) 1px, transparent 0)',
      },
      fontFamily: {
        sans: [
          '"Noto Sans JP"',
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Yu Gothic',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgb(15 23 42 / 0.08), 0 2px 8px -2px rgb(15 23 42 / 0.04)',
        card: '0 1px 3px rgb(15 23 42 / 0.06), 0 12px 32px -12px rgb(15 23 42 / 0.12)',
        header: '0 4px 24px -2px rgb(15 23 42 / 0.18)',
      },
    },
  },
  plugins: [],
};
