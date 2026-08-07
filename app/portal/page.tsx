import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SessionRepository } from '@/lib/server/repositories/session.repository';
import SessionCard from '@/components/portal/SessionCard';
import type { ConfiguratorSession } from '@/lib/types';

export default async function PortalPage() {
  const session = await auth();
  if (!session) redirect('/auth/signin?callbackUrl=/portal');

  const sessionRepo = new SessionRepository();
  const tenantId = (session.user as { tenantId?: string })?.tenantId || '00000000-0000-0000-0000-000000000000';
  const sessions = await sessionRepo.findByHost(session.user!.email!, tenantId);

  const typedSessions = sessions as unknown as ConfiguratorSession[];

  const upcoming = typedSessions.filter(s => s.isActive && s.startAt && s.startAt > new Date());
  const past = typedSessions.filter(s => s.isActive && s.startAt && s.startAt <= new Date());
  const cancelled = typedSessions.filter(s => !s.isActive);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-white">Your sessions</h1>
          <p className="text-sm text-gray-400 mt-1">{session.user?.email}</p>
        </div>
        <a
          href="/book"
          className="text-sm border border-gray-700 rounded-lg px-4 py-2 hover:bg-surface transition text-white text-center min-h-touch flex items-center justify-center sm:inline-flex"
        >
          + Book session
        </a>
      </div>

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Upcoming
          </h2>
          {upcoming.map(s => <SessionCard key={s.id} session={s as ConfiguratorSession} />)}
        </section>
      )}

      {past.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Past
          </h2>
          {past.map(s => <SessionCard key={s.id} session={s as ConfiguratorSession} isPast />)}
        </section>
      )}

      {cancelled.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Cancelled
          </h2>
          {cancelled.map(s => <SessionCard key={s.id} session={s as ConfiguratorSession} isCancelled />)}
        </section>
      )}
    </main>
  );
}
