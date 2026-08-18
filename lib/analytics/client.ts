'use client';
import { useCallback } from 'react';
import type { EventName, EventPropertiesMap } from './events';

export function useAnalytics() {
  const track = useCallback(
    async <T extends EventName>(event: T, properties: EventPropertiesMap[T]) => {
      if (typeof window === 'undefined') return;
      const consent = localStorage.getItem('viztr-cookie-consent');
      if (consent !== 'accepted') return;
      try {
        await fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, properties }), keepalive: true });
      } catch { console.debug('[Analytics] Track failed:', event); }
    }, []
  );
  return { track };
}