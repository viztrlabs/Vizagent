'use client';

import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Suspense, useState } from 'react';

function getInitialMode(): 'request' | 'update' {
  if (typeof window === 'undefined') return 'request';
  const hash = window.location.hash;
  if (hash.includes('access_token') || hash.includes('type=recovery')) {
    return 'update';
  }
  return 'request';
}

function PasswordResetFormInner() {
  const [mode] = useState<'request' | 'update'>(getInitialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/password-reset`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  if (success && mode === 'request') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white font-body mb-2">Check your email</h1>
          <p className="text-gray-400 font-body text-sm mb-6">
            We sent a password reset link to <span className="text-white">{email}</span>.
          </p>
          <Link
            href="/auth/signin"
            className="block text-center text-sm text-cyan hover:underline font-body"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (success && mode === 'update') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white font-body mb-2">Password updated</h1>
          <p className="text-gray-400 font-body text-sm mb-6">
            Your password has been changed successfully.
          </p>
          <Link
            href="/portal"
            className="block text-center py-2.5 rounded-lg bg-cyan text-black font-semibold font-body transition-opacity hover:opacity-90"
          >
            Go to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white font-body mb-2">
          {mode === 'request' ? 'Reset your password' : 'Set new password'}
        </h1>
        <p className="text-gray-400 font-body text-sm mb-6">
          {mode === 'request'
            ? 'Enter your email and we\'ll send you a reset link.'
            : 'Enter your new password below.'}
        </p>

        {mode === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 font-body">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/60 font-body"
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="text-sm text-red-400 font-body">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan text-black font-semibold font-body transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 font-body">
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/60 font-body"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 font-body">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/60 font-body"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400 font-body">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan text-black font-semibold font-body transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-400 font-body mt-6">
          <Link href="/auth/signin" className="text-cyan hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export function PasswordResetForm() {
  return (
    <Suspense fallback={<div className="text-gray-400 font-body">Loading…</div>}>
      <PasswordResetFormInner />
    </Suspense>
  );
}