/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fef7ee',
          100: '#fdedd7',
          200: '#fad7ae',
          300: '#f6b97a',
          400: '#f19044',
          500: '#ed7220',
          600: '#de5916',
          700: '#b84314',
          800: '#933618',
          900: '#762e16',
        },
      },
      typography: () => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      }),
    },
  },
  plugins: [],
}
