import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SessionCard } from '@/components/portal/SessionCard';

const SERVICE_NAMES: Record<string, string> = {
  'vr-walkthrough': 'VR Walkthrough',
  'exterior-viz': 'Exterior Visualisation',
  'interior-xr': 'Interior XR Tour',
  'masterplan': 'Master Plan Review',
};

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

  const totalHours = sessions.reduce((acc: number, s: any) => acc + (s.durationMinutes || 0), 0) / 60;

  return (
    <div className="viztr-portal">
      <header className="viztr-portal-header">
        <a href="/" className="viztr-logo">
          <div className="viztr-logo-mark">V</div>
          <span className="viztr-logo-name">VizTR</span>
        </a>
        <div className="viztr-header-spacer" />
        <div className="viztr-user-info">
          <div className="viztr-user-avatar">{user.email?.charAt(0).toUpperCase()}</div>
          <span className="viztr-user-email">{user.email}</span>
        </div>
      </header>

      <main className="viztr-portal-main">
        <div className="viztr-portal-hero">
          <h1 className="viztr-portal-title">Your sessions</h1>
          <p className="viztr-portal-subtitle">
            Manage your virtual tours and 3D experiences
          </p>
        </div>

        <div className="viztr-stats-row">
          <div className="viztr-stat-card">
            <div className="viztr-stat-value">{sessions.length}</div>
            <div className="viztr-stat-label">Total Sessions</div>
          </div>
          <div className="viztr-stat-card">
            <div className="viztr-stat-value">{upcoming.length}</div>
            <div className="viztr-stat-label">Upcoming</div>
          </div>
          <div className="viztr-stat-card">
            <div className="viztr-stat-value">{Math.round(totalHours * 10) / 10}</div>
            <div className="viztr-stat-label">Hours Streamed</div>
          </div>
        </div>

        {upcoming.length > 0 && (
          <section className="viztr-section">
            <div className="viztr-section-header">
              <h2 className="viztr-section-title">Upcoming</h2>
              <span className="viztr-section-count">{upcoming.length}</span>
            </div>
            {upcoming.map((s: any) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </section>
        )}

        {past.length > 0 && (
          <section className="viztr-section">
            <div className="viztr-section-header">
              <h2 className="viztr-section-title">Past</h2>
              <span className="viztr-section-count">{past.length}</span>
            </div>
            {past.map((s: any) => (
              <SessionCard key={s.id} session={s} isPast />
            ))}
          </section>
        )}

        {cancelled.length > 0 && (
          <section className="viztr-section">
            <div className="viztr-section-header">
              <h2 className="viztr-section-title">Cancelled</h2>
              <span className="viztr-section-count viztr-count-cancelled">{cancelled.length}</span>
            </div>
            {cancelled.map((s: any) => (
              <SessionCard key={s.id} session={s} isCancelled />
            ))}
          </section>
        )}

        {sessions.length === 0 && (
          <div className="viztr-empty-state">
            <div className="viztr-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3 className="viztr-empty-title">No sessions yet</h3>
            <p className="viztr-empty-text">Book your first virtual tour session</p>
            <a href="/book" className="viztr-btn-primary">
              Book session
            </a>
          </div>
        )}
      </main>

      <style jsx>{`
        .viztr-portal {
          min-height: 100vh;
          background: #0D0D0F;
          color: #F0EDE8;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .viztr-portal-header {
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          background: #0D0D0F;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .viztr-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .viztr-logo-mark {
          width: 26px;
          height: 26px;
          background: linear-gradient(135deg, #534AB7, #00C8E0);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 12px;
          color: #fff;
        }
        .viztr-logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #F0EDE8;
        }
        .viztr-header-spacer {
          flex: 1;
        }
        .viztr-user-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .viztr-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(201, 168, 76, 0.15);
          border: 1px solid rgba(201, 168, 76, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 500;
          color: #C9A84C;
        }
        .viztr-user-email {
          font-size: 12px;
          color: #A09D97;
          font-family: 'JetBrains Mono', monospace;
        }
        .viztr-portal-main {
          max-width: 640px;
          margin: 0 auto;
          padding: 32px 16px;
        }
        .viztr-portal-hero {
          margin-bottom: 32px;
        }
        .viztr-portal-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #F0EDE8;
          margin-bottom: 4px;
        }
        .viztr-portal-subtitle {
          font-size: 13px;
          color: #A09D97;
        }
        .viztr-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }
        .viztr-stat-card {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .viztr-stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 24px;
          font-weight: 500;
          color: #F0EDE8;
          margin-bottom: 4px;
        }
        .viztr-stat-label {
          font-size: 11px;
          color: #55534E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .viztr-section {
          margin-bottom: 32px;
        }
        .viztr-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .viztr-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #55534E;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .viztr-section-count {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: #A09D97;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .viztr-count-cancelled {
          color: #E24B4A;
          background: rgba(226, 75, 74, 0.1);
        }
        .viztr-empty-state {
          text-align: center;
          padding: 64px 0;
        }
        .viztr-empty-icon {
          color: #55534E;
          margin-bottom: 16px;
        }
        .viztr-empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #F0EDE8;
          margin-bottom: 8px;
        }
        .viztr-empty-text {
          font-size: 13px;
          color: #A09D97;
          margin-bottom: 24px;
        }
        .viztr-btn-primary {
          display: inline-block;
          background: linear-gradient(135deg, #534AB7, #00C8E0);
          color: #fff;
          text-decoration: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .viztr-btn-primary:hover {
          opacity: 0.9;
        }
        @media (max-width: 480px) {
          .viztr-user-email {
            display: none;
          }
          .viztr-stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
