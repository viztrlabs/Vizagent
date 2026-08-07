import { Queue } from 'bullmq';
import { Redis } from '@upstash/redis';

let redisConnection: Redis | null = null;

function getRedisConnection(): Redis {
  if (!redisConnection) {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set');
    }

    redisConnection = new Redis({ url, token });
  }
  return redisConnection;
}

export function getSessionReminderQueue() {
  return new Queue('session-reminder', {
    connection: getRedisConnection() as unknown as import('bullmq').ConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
}
