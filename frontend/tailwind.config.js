/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
