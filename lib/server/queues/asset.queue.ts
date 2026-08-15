import { Queue, Job } from 'bullmq';
import { redis } from '@/lib/server/lib/redis';

export const ASSET_QUEUE_NAME = 'asset-optimization';

export const assetQueue = new Queue(ASSET_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

export type AssetOptimizationJobData = {
  assetId: string;
  tenantId: string;
  storagePath: string;
  type: 'image' | 'model';
};

export type AssetTilingJobData = {
  assetId: string;
  tenantId: string;
  storagePath: string;
};

export async function addOptimizationJob(data: AssetOptimizationJobData) {
  return assetQueue.add('optimize', { ...data }, { priority: data.type === 'image' ? 10 : 5 });
}

export async function addTilingJob(data: AssetTilingJobData) {
  return assetQueue.add('tile', { ...data }, { priority: 1 });
}