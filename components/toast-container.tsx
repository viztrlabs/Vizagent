'use client';

import { useEffect } from 'react';
import { useToast } from './toast-context';

const variantStyles = {
  default: 'bg-surface border-gray-800 text-white',
  destructive: 'bg-red-950 border-red-800 text-red-200',
  success: 'bg-emerald-950 border-emerald-800 text-emerald-200',
};

export function ToastContainer() {
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      addToast(detail);
    };
    window.addEventListener('viztr-toast', handler);
    return () => window.removeEventListener('viztr-toast', handler);
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border px-4 py-3 shadow-lg ${variantStyles[t.variant ?? 'default']} animate-in slide-in-from-right`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-sm font-medium">{t.title}</p>
              )}
              {t.description && (
                <p className="text-sm opacity-80 mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-white shrink-0"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
