import { Worker } from 'bullmq';
import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/db/server';
import { sendReminderEmail } from '@/lib/server/services/email.service';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const worker = new Worker(
  'session-reminder',
  async (job) => {
    const { aggregateId } = job.data;

    console.log(`Sending reminder for session ${aggregateId}`);

    const session = await prisma.configuratorSession.findUnique({
      where: { id: aggregateId },
      include: { viewers: true },
    });

    if (!session) {
      console.warn(`Session ${aggregateId} not found`);
      return;
    }

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
            }) || 'TBD'} IST
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
          try {
            await sendReminderEmail(
              user.email,
              'Your XR Configurator session starts in 1 hour',
              html
            );
          } catch (error) {
            console.error(`Failed to send reminder to ${user.email}:`, error);
          }
        }
      }
    }
  },
  {
    connection: redis as unknown as import('bullmq').ConnectionOptions,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Reminder job ${job?.id} failed with error:`, err);
});

export default worker;
