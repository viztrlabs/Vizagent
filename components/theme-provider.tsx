'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

// M0.2 design tokens: dual-theme (dark/light/auto) via next-themes.
// Defaults to dark to preserve the pre-M0.2 visual until per-component
// light-mode classes are swept in (tracked as a follow-on item).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}