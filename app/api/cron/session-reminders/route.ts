import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { sendReminderEmail } from '@/lib/server/services/email.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingSessions = await prisma.configuratorSession.findMany({
      where: {
        isActive: true,
        startAt: {
          gte: now,
          lte: oneHourLater,
        },
        reminderSentAt: null,
      },
      include: {
        viewers: true,
      },
    });

    for (const session of upcomingSessions) {
      const html = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px">
            <h2 style="font-size: 18px; font-weight: 500; margin-bottom: 8px">
              Your XR Configurator session starts soon
            </h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 24px">
              ${session.startAt?.toLocaleString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata',
              })} IST
            </p>
            <a href="${process.env.NEXTAUTH_URL}/portal"
               style="display: block; background: #00e5ff; color: #080a0f; text-align: center;
                      padding: 12px; border-radius: 8px; text-decoration: none; font-size: 14px;
                      font-weight: 500; margin-bottom: 16px">
              View session details
            </a>
            <p style="font-size: 12px; color: #aaa; text-align: center">
              Your architect will start the stream a few minutes before the session time.
            </p>
          </body>
        </html>
      `;

      for (const viewer of session.viewers) {
        if (viewer.userId) {
          const user = await prisma.user.findUnique({
            where: { id: viewer.userId },
          });

          if (user?.email) {
            await sendReminderEmail(
              user.email,
              'Your XR Configurator session starts in 1 hour',
              html
            );
          }
        }
      }

      await prisma.configuratorSession.update({
        where: { id: session.id },
        data: { reminderSentAt: now },
      });
    }

    return NextResponse.json({
      success: true,
      processed: upcomingSessions.length,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
