import type { Config } from 'tailwindcss';

// Dark theme by default via `.dark` on <html>; `.light` opt-in handled by CSS vars.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // serif for read-aloud / reading text, sans for UI
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        secret: 'rgb(var(--secret) / <alpha-value>)',
        sanity: 'rgb(var(--sanity) / <alpha-value>)',
        test: 'rgb(var(--test) / <alpha-value>)',
      },
    },
  },
  plugins: [],
} satisfies Config;
