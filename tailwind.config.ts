import type { Config } from 'tailwindcss';
import colorNames from './styles/color-tokens.json';

const colors = Object.fromEntries((colorNames as string[]).map((n) => [n, `var(--${n})`]));

export default {
  content: ['./app/**/*.{ts,tsx}', './auth/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './layouts/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './screens/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors,
      borderRadius: { sm: '8px', md: '12px', pill: '999px' },
      fontFamily: { sans: ['"Noto Sans"', '"Noto Sans Lao"', '"Phetsarath OT"', 'system-ui', 'sans-serif'] },
      boxShadow: { card: 'var(--shadow-card)', overlay: 'var(--shadow-overlay)' },
      fontSize: {
        'page-title': ['28px', { lineHeight: '40px', fontWeight: '600' }],
        // The live check-in clock: the one oversized reading on an employee's day.
        clock: ['40px', { lineHeight: '48px', fontWeight: '700' }],
        'stat-value': ['30px', { lineHeight: '38px', fontWeight: '700' }],
        // Kip amounts in stat cards: one step under stat-value so 10-digit sums stay on one line in four columns.
        'stat-money': ['26px', { lineHeight: '38px', fontWeight: '700' }],
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
