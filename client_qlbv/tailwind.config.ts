import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          DEFAULT: '#0ea5e9',
          dark:    '#0284c7',
          light:   '#e0f2fe',
        },
        sidebar: '#0f172a',
        surface: '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / .08), 0 2px 4px -1px rgb(0 0 0 / .04)',
        dialog: '0 20px 60px -10px rgb(0 0 0 / .25)',
        glow:   '0 0 0 3px rgb(14 165 233 / .15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        scaleIn:      { from: { opacity: '0', transform: 'scale(.95) translateY(4px)' }, to: { opacity: '1', transform: 'scale(1) translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(24px)' },           to: { opacity: '1', transform: 'translateX(0)' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(16px)' },           to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:       { from: { opacity: '0' },                                           to: { opacity: '1' } },
        shimmer:      { from: { backgroundPosition: '-200% 0' },                          to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        scaleIn:      'scaleIn .2s cubic-bezier(.16,1,.3,1)',
        slideInRight: 'slideInRight .25s cubic-bezier(.16,1,.3,1)',
        slideUp:      'slideUp .25s cubic-bezier(.16,1,.3,1)',
        fadeIn:       'fadeIn .15s ease',
        shimmer:      'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
