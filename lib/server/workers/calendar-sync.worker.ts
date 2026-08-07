import { Worker } from 'bullmq';
import { Redis } from '@upstash/redis';

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
      console.warn('No Google access token available for calendar sync');
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

      console.log(`Calendar event created: ${gcalEventId} for booking ${job.data.aggregateId}`);
    } catch (error) {
      console.error(`Failed to sync booking ${job.data.aggregateId} to Google Calendar:`, error);
      throw error;
    }
  },
  {
    connection: redis as unknown as import('bullmq').ConnectionOptions,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});

export default worker;
