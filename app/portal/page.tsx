import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PortalClient } from './PortalClient';

export default async function PortalPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin?callbackUrl=/portal');

  const sessions = await prisma.session.findMany({
    where: { email: user.email! },
    orderBy: { startAt: 'desc' },
  });

  const upcoming = sessions.filter(
    (s) => s.status === 'CONFIRMED' && s.startAt > new Date()
  );
  const past = sessions.filter(
    (s) => s.status === 'CONFIRMED' && s.startAt <= new Date()
  );
  const cancelled = sessions.filter((s) => s.status === 'CANCELLED');

  const totalHours = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60;

  return (
    <PortalClient
      user={user}
      sessions={sessions}
      upcoming={upcoming}
      past={past}
      cancelled={cancelled}
      totalHours={totalHours}
    />
  );
}