'use client';

import { useState, useEffect, createContext, useContext } from 'react';

type ConsentCategory = 'essential' | 'analytics' | 'marketing';

interface ConsentState {
  essential: true;
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentContextType {
  consent: ConsentState | null;
  showBanner: boolean;
  updateConsent: (consent: ConsentState) => void;
  acceptAll: () => void;
  rejectAll: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

const STORAGE_KEY = 'viztr-cookie-consent';

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const saveConsent = (c: ConsentState) => {
    setConsent(c);
    setShowBanner(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: c }));
  };

  const updateConsent = (c: ConsentState) => saveConsent({ ...c, essential: true });

  const acceptAll = () => saveConsent({ essential: true, analytics: true, marketing: true });

  const rejectAll = () => saveConsent({ essential: true, analytics: false, marketing: false });

  return (
    <CookieConsentContext.Provider value={{ consent, showBanner, updateConsent, acceptAll, rejectAll }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}

export function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectAll } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-surface border border-gray-800 rounded-xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-2">We value your privacy</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We use essential cookies for authentication and analytics cookies (PostHog) to improve our Service.
              Analytics are only loaded with your consent. You can change your preferences anytime.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={rejectAll}
              className="px-4 py-2 text-sm font-medium text-gray-300 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors"
            >
              Reject All
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
        <div className="mt-3 text-center">
          <a href="/legal/privacy-policy" className="text-xs text-gray-500 hover:text-gray-400 underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
