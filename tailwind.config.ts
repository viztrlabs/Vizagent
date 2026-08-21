import type { Config } from 'tailwindcss'
import tokens from '../packages/design-tokens/tokens.json'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens from packages/design-tokens/tokens.json
        // Mapped to CSS vars in globals.css for dual-theme support
        ...tokens.color,
        // Explicit aliases for common references
        primary: tokens.color.primary,
        secondary: tokens.color.secondary,
        accent: tokens.color.accent,
        neutral: tokens.color.neutral,
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      borderRadius: {
        none: '0',
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
        full: tokens.radius.full,
      },
      spacing: {
        ...tokens.spacing,
        base: '4px',
      },
      fontFamily: {
        // next/font variables injected on <html> (see app/layout.tsx)
        display: [tokens.typography.display.fontFamily, tokens.typography.display.fontWeightRegular],
        heading: [tokens.typography.display.fontFamily, tokens.typography.display.fontWeightMedium],
        body: [tokens.typography.body.fontFamily, tokens.typography.body.fontWeightRegular],
        mono: [tokens.typography.code.fontFamily, tokens.typography.code.fontSize],
      },
      spacing: tokens.spacing,
    },
    fontSize: tokens.typography.display.size.concat(tokens.typography.body.size),
    lineHeight: tokens.typography.display.size.length > 0 ? tokens.typography.display.size[0]?.lineHeight : '1.2',
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
  darkMode: 'class',
}

export default config