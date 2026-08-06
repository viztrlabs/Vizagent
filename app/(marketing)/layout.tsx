'use client';

import { useState } from 'react';
import Footer from '@/components/Footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-gray-800">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-2xl text-cyan">VizTR</a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a>
            <a href="/login" className="text-gray-400 hover:text-white transition-colors">Login</a>
            <a href="/auth/signin" className="px-4 py-2 bg-cyan text-bg rounded-md font-medium hover:bg-cyan/90 transition-colors min-h-touch">Sign Up</a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 min-h-touch min-w-touch"
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-white transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-white transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-white transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </nav>

        {/* Mobile menu drawer overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile menu drawer */}
        <div 
          className={`fixed inset-y-0 left-0 w-64 bg-surface z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col border-r border-gray-800 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <a href="/" className="font-display text-2xl text-cyan">VizTR</a>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 min-h-touch min-w-touch text-gray-400 hover:text-white"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-4 py-6 space-y-4 flex-1">
            <a
              href="/pricing"
              className="block py-2 text-gray-400 hover:text-white transition-colors min-h-touch text-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="/dashboard"
              className="block py-2 text-gray-400 hover:text-white transition-colors min-h-touch text-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </a>
            <a
              href="/login"
              className="block py-2 text-gray-400 hover:text-white transition-colors min-h-touch text-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </a>
          </div>
          <div className="p-4 border-t border-gray-800">
            <a
              href="/auth/signin"
              className="block w-full py-3 bg-cyan text-bg rounded-md font-medium text-center min-h-touch"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
