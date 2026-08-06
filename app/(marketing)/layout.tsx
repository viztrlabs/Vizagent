'use client';

import { useState } from 'react';
import Link from 'next/link';
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
          <Link href="/" className="font-display text-2xl text-cyan">VizTR</Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
            <Link href="/auth/signin" className="px-4 py-2 bg-cyan text-bg rounded-md font-medium hover:bg-cyan/90 transition-colors min-h-touch">Sign Up</Link>
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-surface">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link
                href="/pricing"
                className="block py-2 text-gray-400 hover:text-white transition-colors min-h-touch flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/dashboard"
                className="block py-2 text-gray-400 hover:text-white transition-colors min-h-touch flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="block py-2 text-gray-400 hover:text-white transition-colors min-h-touch flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/auth/signin"
                className="block py-3 bg-cyan text-bg rounded-md font-medium text-center min-h-touch"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}