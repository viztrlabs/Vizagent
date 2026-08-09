'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';

export function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-body"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    );
  }

  return (
    <Link
      href="/auth/signin"
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-cyan-400 hover:text-white transition-colors font-body"
    >
      Sign in
    </Link>
  );
}
