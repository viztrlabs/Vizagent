import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = Parameters<SetAllCookies>[0][number];

/**
 * Supabase SSR server client (cookie-aware).
 *
 * Use in Server Components, route handlers, and the getTenantId() flow.
 *
 * NOTE: the repo previously had `lib/supabase/server.ts` exporting a
 * PrismaClient under a misleading name. This file is the dedicated Supabase
 * server client — a single source of truth for reading the session cookie and
 * resolving the authenticated Supabase auth user.
 */
export async function serverSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component where the cookie store is
            // read-only. Middleware owns cookie writeback in that context.
          }
        },
      },
    }
  );
}

/**
 * Resolve the authenticated Supabase auth user (id + email) or null.
 * Uses the short-lived access token via getUser() (server-validated, not
 * trusting the JWT payload blindly).
 */
export async function getSessionUser() {
  const supabase = await serverSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}