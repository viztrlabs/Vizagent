import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from './lib/db/server';

type CookieToSet = Parameters<SetAllCookies>[0][number];

type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'CLIENT';

/** Roles allowed to access each route group. */
const ROLE_ACCESS: Record<string, AppRole[]> = {
  '/admin': ['SUPER_ADMIN', 'ADMIN'],
  '/enterprise': ['SUPER_ADMIN', 'ADMIN'],
  '/xr-console': ['SUPER_ADMIN', 'ADMIN'],
  '/dashboard': ['SUPER_ADMIN', 'ADMIN', 'USER'],
  '/configurator': ['SUPER_ADMIN', 'ADMIN', 'USER'],
  '/book': ['SUPER_ADMIN', 'ADMIN', 'USER'],
  '/portal': ['SUPER_ADMIN', 'ADMIN', 'USER', 'CLIENT'],
  '/api/admin': ['SUPER_ADMIN', 'ADMIN'],
  '/api/enterprise': ['SUPER_ADMIN', 'ADMIN'],
};

/** Check if a pathname requires a specific role set. */
function getRequiredRoles(pathname: string): AppRole[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_ACCESS)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return roles;
    }
  }
  return null;
}

function normalizeRole(role?: string | null): AppRole {
  const r = (role ?? '').trim().toUpperCase();
  if (r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'USER' || r === 'CLIENT') {
    return r as AppRole;
  }
  return 'CLIENT';
}

const isProtectedPath = (pathname: string) =>
  pathname === '/portal' ||
  pathname.startsWith('/portal/') ||
  pathname === '/dashboard' ||
  pathname.startsWith('/dashboard/') ||
  pathname === '/admin' ||
  pathname.startsWith('/admin/') ||
  pathname === '/configurator' ||
  pathname.startsWith('/configurator/') ||
  pathname === '/book' ||
  pathname.startsWith('/book/') ||
  pathname === '/xr-console' ||
  pathname.startsWith('/xr-console/') ||
  pathname === '/enterprise' ||
  pathname.startsWith('/enterprise/');

const isApiProtectedPath = (pathname: string) =>
  pathname.startsWith('/api/admin') ||
  pathname.startsWith('/api/projects') ||
  pathname.startsWith('/api/assets') ||
  pathname.startsWith('/api/deployments') ||
  pathname.startsWith('/api/bookings') ||
  pathname.startsWith('/api/billing') ||
  pathname.startsWith('/api/enterprise') ||
  pathname.startsWith('/api/configurator') ||
  pathname.startsWith('/api/collab') ||
  pathname.startsWith('/api/communications') ||
  pathname.startsWith('/api/crm') ||
  pathname.startsWith('/api/agents') ||
  pathname.startsWith('/api/pages');

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value }) =>
            supabaseResponse.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users to sign-in
  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.search = '';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Return 401 for unauthenticated API requests
  if (isApiProtectedPath(pathname) && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Redirect authenticated users away from auth pages
  if (user && pathname.startsWith('/auth/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/portal';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (user) {
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles) {
      // Look up user role from DB (lightweight query)
      let role: AppRole = 'CLIENT';
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { role: true },
        });
        role = normalizeRole(dbUser?.role);
      } catch {
        // DB unavailable - default to CLIENT
        role = 'CLIENT';
      }

      // SUPER_ADMIN bypasses all checks
      if (role !== 'SUPER_ADMIN' && !requiredRoles.includes(role)) {
        // Redirect to appropriate page based on role
        const url = request.nextUrl.clone();
        if (role === 'ADMIN' || role === 'USER') {
          url.pathname = '/portal';
        } else {
          url.pathname = '/auth/signin';
        }
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
