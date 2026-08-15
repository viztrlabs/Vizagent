'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

// M0.2: dual-theme (dark/light/auto) toggle. Resolves theme client-side to
// avoid hydration mismatch. Uses useSyncExternalStore (server snapshot false,
// client snapshot true) to detect mount WITHOUT setState-in-effect, which the
// react-hooks v6 rule would otherwise flag.
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(emptySubscribe, () => true, () => false);

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <button className="p-2 min-h-touch min-w-touch text-gray-400" aria-label="Toggle theme" disabled />;
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 min-h-touch min-w-touch text-gray-400 hover:text-white transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}