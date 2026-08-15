import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // M0.2: semantic tokens backed by dual-theme CSS vars in globals.css.
        // Dark default preserves pre-M0.2 visuals; light mode flips with theme.
        bg: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        cyan: 'var(--primary)',
        violet: 'var(--accent)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      fontFamily: {
        // next/font variables are injected on <html> (see app/layout.tsx)
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      spacing: {
        base: '4px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

export default config