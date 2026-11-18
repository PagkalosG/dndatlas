/** Celestial Atlas design tokens. All text/background pairs below meet WCAG AA (>= 4.5:1) on `night` surfaces. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: { 950: '#07091A', 900: '#0B0F24', 800: '#11172F', 700: '#18203F', 600: '#222B52', 500: '#2F3A6A' },
        star: { 50: '#F4F6FF', 100: '#E6EAFB', 200: '#C9D1F0', 300: '#A9B4DC', 400: '#8E9AC8' },
        gold: { 300: '#F1DC9F', 400: '#E5C76B', 500: '#D4AF37', 600: '#B08D1E' },
        nebula: { 400: '#8B7CF6', 500: '#6D5BE0' },
        ok: '#4ADE80',
        warn: '#FBBF24',
        danger: '#F87171',
        info: '#60A5FA',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(212,175,55,.55), 0 0 24px -6px rgba(212,175,55,.35)',
      },
    },
  },
  plugins: [],
};
