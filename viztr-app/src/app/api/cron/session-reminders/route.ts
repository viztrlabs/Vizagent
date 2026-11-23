import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { reminderEmailHTML } from '@/lib/emails/reminder';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  // Vercel cron security — reject requests without the secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 75 * 60 * 1000); // 15-min window

  // Find sessions starting 60–75 min from now that haven't been reminded yet
  const upcoming = await prisma.configuratorSession.findMany({
    where: {
      isActive: true,
      reminderSentAt: null,
      startAt: {
        gte: oneHourFromNow,
        lte: windowEnd,
      },
    },
  });

  const results = await Promise.allSettled(
    upcoming.map(async (session) => {
      await resend.emails.send({
        from: 'VizTR <bookings@viztr.io>',
        to: session.hostId, // Using host_id as email for now
        subject: `Your session starts in 1 hour — ${session.id}`,
        html: reminderEmailHTML(session),
      });

      await prisma.configuratorSession.update({
        where: { id: session.id },
        data: { reminderSentAt: new Date() },
      });
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return NextResponse.json({ sent, total: upcoming.length });
}