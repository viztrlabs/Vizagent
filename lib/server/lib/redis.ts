import Redis from 'ioredis';
import { createLogger } from '../logger';

const log = createLogger({ module: 'redis' });

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('error', (err) => log.error({ err }, 'Redis connection error'));
redis.on('connect', () => log.info('Redis connected'));