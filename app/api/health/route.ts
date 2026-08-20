import { NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: 'ok' | 'error'; latencyMs?: number; error?: string };
    redis: { status: 'ok' | 'error' | 'skipped'; latencyMs?: number; error?: string };
  };
}

async function checkDatabase(): Promise<HealthCheck['checks']['database']> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown database error',
    };
  }
}

async function checkRedis(): Promise<HealthCheck['checks']['redis']> {
  if (!process.env.REDIS_URL) {
    return { status: 'skipped' };
  }
  try {
    const { default: Redis } = await import('ioredis');
    const start = Date.now();
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await redis.connect();
    await redis.ping();
    await redis.quit();
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return {
      status: 'error',
      error: e instanceof Error ? e.message : 'Unknown Redis error',
    };
  }
}

export async function GET() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const checks = { database, redis };
  const allOk = database.status === 'ok' && (redis.status === 'ok' || redis.status === 'skipped');
  const anyError = database.status === 'error' || redis.status === 'error';

  const health: HealthCheck = {
    status: anyError ? 'unhealthy' : allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
