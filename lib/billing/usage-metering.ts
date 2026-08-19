// M14: Usage Metering — processing minutes, storage, GPU hours
import { prisma } from '@/lib/db/server';
import { Tier, getTierConfig } from '@/lib/stripe/tiers';

export interface UsageRecord {
  userId: string;
  tenantId: string;
  metric: 'processing_minutes' | 'storage_gb' | 'gpu_hours';
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  current: {
    processingMinutes: number;
    storageGb: number;
    gpuHours: number;
  };
  limits: {
    processingMinutes: number;
    storageGb: number;
    gpuHours: number;
  };
  percentage: {
    processingMinutes: number;
    storageGb: number;
    gpuHours: number;
  };
  tier: Tier;
  overLimit: boolean;
}

// In-memory fallback (replace with DB table in production)
const usageCache: Map<string, UsageRecord[]> = new Map();

export async function recordUsage(record: UsageRecord): Promise<void> {
  const key = `${record.userId}:${record.metric}`;
  const existing = usageCache.get(key) || [];
  existing.push(record);
  // Keep last 1000 records
  if (existing.length > 1000) existing.shift();
  usageCache.set(key, existing);
}

export async function getUsage(
  userId: string,
  tenantId: string,
  from?: Date,
  to?: Date
): Promise<UsageSummary> {
  const subscription = await prisma.subscription.findFirst({ where: { userId } });
  const tier = (subscription?.tier as Tier) || 'free';
  const config = getTierConfig(tier);

  // Aggregate from cache (in production, query DB)
  const now = new Date();
  const start = from || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = to || now;

  let processingMinutes = 0;
  let storageGb = 0;
  let gpuHours = 0;

  const cacheKey = `${userId}:processing_minutes`;
  const processingRecords = usageCache.get(cacheKey) || [];
  for (const r of processingRecords) {
    if (r.timestamp >= start && r.timestamp <= end) processingMinutes += r.value;
  }

  const storageKey = `${userId}:storage_gb`;
  const storageRecords = usageCache.get(storageKey) || [];
  for (const r of storageRecords) {
    if (r.timestamp >= start && r.timestamp <= end) storageGb += r.value;
  }

  const gpuKey = `${userId}:gpu_hours`;
  const gpuRecords = usageCache.get(gpuKey) || [];
  for (const r of gpuRecords) {
    if (r.timestamp >= start && r.timestamp <= end) gpuHours += r.value;
  }

  const limits = config?.limits || { processingMinutes: 100, storageGb: 1, gpuHours: 1 };

  return {
    current: { processingMinutes, storageGb, gpuHours },
    limits,
    percentage: {
      processingMinutes: limits.processingMinutes > 0 ? (processingMinutes / limits.processingMinutes) * 100 : 0,
      storageGb: limits.storageGb > 0 ? (storageGb / limits.storageGb) * 100 : 0,
      gpuHours: limits.gpuHours > 0 ? (gpuHours / limits.gpuHours) * 100 : 0,
    },
    tier,
    overLimit:
      (limits.processingMinutes > 0 && processingMinutes > limits.processingMinutes) ||
      (limits.storageGb > 0 && storageGb > limits.storageGb) ||
      (limits.gpuHours > 0 && gpuHours > limits.gpuHours),
  };
}

export async function checkLimit(
  userId: string,
  metric: 'processing_minutes' | 'storage_gb' | 'gpu_hours',
  additionalValue = 0
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const usage = await getUsage(userId, '');
  const metricMap: Record<string, keyof typeof usage.current> = {
    processing_minutes: 'processingMinutes',
    storage_gb: 'storageGb',
    gpu_hours: 'gpuHours',
  };
  const key = metricMap[metric];
  const current = usage.current[key];
  const limit = usage.limits[key];
  return {
    allowed: limit < 0 || current + additionalValue <= limit,
    current,
    limit,
  };
}

export async function getUsageHistory(
  userId: string,
  metric: 'processing_minutes' | 'storage_gb' | 'gpu_hours',
  days = 30
): Promise<{ date: string; value: number }[]> {
  const cacheKey = `${userId}:${metric}`;
  const records = usageCache.get(cacheKey) || [];
  const now = new Date();
  const result: { date: string; value: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayRecords = records.filter(r => r.timestamp.toISOString().startsWith(dateStr));
    const total = dayRecords.reduce((sum, r) => sum + r.value, 0);
    result.push({ date: dateStr, value: total });
  }

  return result;
}