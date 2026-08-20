import { Worker } from 'bullmq';
import { Redis } from '@upstash/redis';
import { createLogger } from '../logger';

const log = createLogger({ module: 'calendar-sync-worker' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const worker = new Worker(
  'calendar-sync',
  async (job) => {
    const { service, date, time, duration, clientName, projectType } = job.data.payload;

    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    if (!accessToken) {
      log.warn('No Google access token available for calendar sync');
      return;
    }

    try {
      const { addSessionToCalendar } = await import('@/lib/google-calendar');
      const gcalEventId = await addSessionToCalendar(accessToken, {
        id: job.data.aggregateId,
        service: service || 'XR Configurator',
        date: `${date}T${time}:00`,
        durationMinutes: duration || 60,
        clientName: clientName || 'Client',
        projectType: projectType || 'Architectural Visualization',
      });

      log.info({ gcalEventId, bookingId: job.data.aggregateId }, 'Calendar event created');
    } catch (error) {
      log.error({ err: error, bookingId: job.data.aggregateId }, 'Failed to sync to Google Calendar');
      throw error;
    }
  },
  {
    connection: redis as unknown as import('bullmq').ConnectionOptions,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  log.info({ jobId: job.id }, 'Job completed');
});

worker.on('failed', (job, err) => {
  log.error({ err, jobId: job?.id }, 'Job failed');
});

export default worker;
