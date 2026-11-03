import type { Config } from 'tailwindcss';
import colorNames from './src/styles/color-tokens.json';

const colors = Object.fromEntries((colorNames as string[]).map((n) => [n, `var(--${n})`]));

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors,
      borderRadius: { sm: '8px', md: '12px', pill: '999px' },
      fontFamily: { sans: ['"Noto Sans"', '"Noto Sans Lao"', '"Phetsarath OT"', 'system-ui', 'sans-serif'] },
      boxShadow: { card: 'var(--shadow-card)', overlay: 'var(--shadow-overlay)' },
      fontSize: {
        'page-title': ['28px', { lineHeight: '40px', fontWeight: '600' }],
        'stat-value': ['30px', { lineHeight: '38px', fontWeight: '700' }],
        'section-title': ['20px', { lineHeight: '30px', fontWeight: '600' }],
        subhead: ['16px', { lineHeight: '26px', fontWeight: '600' }],
        body: ['15px', { lineHeight: '24px' }],
        'body-sm': ['13px', { lineHeight: '21px' }],
        label: ['14px', { lineHeight: '22px', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '18px', fontWeight: '600' }],
      },
      backgroundImage: { brand: 'linear-gradient(160deg, var(--secondary), var(--secondary-end))' },
    },
  },
  plugins: [],
} satisfies Config;
