'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useAnalytics } from '@/lib/analytics/client';

function SignUpFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/portal';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const { track } = useAnalytics();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    track('signup_started', { method: 'email', referrer: document.referrer });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      track('signup_failed', { error_code: error.message, method: 'email' });
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      track('signup_completed', { method: 'email' });
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    track('signup_completed', { method: 'email' });
    router.push(callbackUrl);
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-surface border border-white/10 rounded-2xl p-8 text-center space-y-3">
          <h1 className="font-display text-3xl text-cyan tracking-wide">
            Check your email
          </h1>
          <p className="text-sm text-gray-400 font-body">
            We sent a confirmation link to{' '}
            <span className="text-white">{email}</span>. Click it to activate
            your account, then sign in.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block mt-2 text-cyan hover:underline font-body"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-white/10 rounded-2xl p-8 space-y-5"
      >
        <div className="text-center">
          <h1 className="font-display text-3xl text-cyan tracking-wide">
            Create account
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-body">
            Get access to your portal and dashboard
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-300 font-body"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/60 font-body"
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 font-body"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/60 font-body"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 font-body"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan/60 font-body"
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="text-sm text-red-400 font-body">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-cyan text-black font-semibold font-body transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="text-center text-sm text-gray-400 font-body">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-cyan hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export function SignUpForm() {
  return (
    <Suspense fallback={null}>
      <SignUpFormInner />
    </Suspense>
  );
}
