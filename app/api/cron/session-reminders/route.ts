import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { reminderEmailHTML } from '@/lib/emails/reminder';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);

  const upcoming = await prisma.session.findMany({
    where: {
      status: 'CONFIRMED',
      reminderSentAt: null,
      startAt: {
        gte: oneHourFromNow,
        lte: windowEnd,
      },
    },
  });

  const SERVICE_NAMES: Record<string, string> = {
    'vr-walkthrough': 'VR Walkthrough',
    'exterior-viz': 'Exterior Visualisation',
    'interior-xr': 'Interior XR Tour',
    'masterplan': 'Master Plan Review',
  };

  const results = await Promise.allSettled(
    upcoming.map(async (session: any) => {
      await resend.emails.send({
        from: 'VizTR <bookings@viztr.io>',
        to: session.email,
        subject: `Your session starts in 1 hour — ${session.id}`,
        html: await reminderEmailHTML({
          id: session.id,
          serviceId: SERVICE_NAMES[session.serviceId] || session.serviceId,
          firstName: session.firstName,
          lastName: session.lastName,
          startAt: session.startAt,
        }),
      });

      await prisma.session.update({
        where: { id: session.id },
        data: { reminderSentAt: new Date() },
      });
    })
  );

  const sent = results.filter((r: any) => r.status === 'fulfilled').length;
  return NextResponse.json({ sent, total: upcoming.length });
}
