import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SessionCard } from '@/components/portal/SessionCard';

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
    (s: any) => s.status === 'CONFIRMED' && s.startAt > new Date()
  );
  const past = sessions.filter(
    (s: any) => s.status === 'CONFIRMED' && s.startAt <= new Date()
  );
  const cancelled = sessions.filter((s: any) => s.status === 'CANCELLED');

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium">Your sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </div>
        <a
          href="/book"
          className="text-sm border border-border rounded-lg px-4 py-2 hover:bg-muted transition"
        >
          + Book session
        </a>
      </div>

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Upcoming
          </h2>
          {upcoming.map((s: any) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Past
          </h2>
          {past.map((s: any) => (
            <SessionCard key={s.id} session={s} isPast />
          ))}
        </section>
      )}

      {cancelled.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Cancelled
          </h2>
          {cancelled.map((s: any) => (
            <SessionCard key={s.id} session={s} isCancelled />
          ))}
        </section>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No sessions yet</p>
          <a
            href="/book"
            className="inline-block bg-primary text-primary-foreground rounded-lg px-6 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Book your first session
          </a>
        </div>
      )}
    </main>
  );
}
