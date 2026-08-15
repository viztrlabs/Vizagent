import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/server/lib/redis';
import { optimizeImage, optimizeModel } from '@/lib/server/optimization/optimizer';
import { tileModel } from '@/lib/server/tiling/tiler';
import { assetQueue, ASSET_QUEUE_NAME } from '@/lib/server/queues/asset.queue';
import { prisma } from '@/lib/db/server';

const worker = new Worker(
  ASSET_QUEUE_NAME,
  async (job: Job) => {
    const { assetId, tenantId, storagePath, type } = job.data;

    await prisma.asset.update({
      where: { id: assetId },
      data: { [`${type === 'image' ? 'optimized' : 'tiling'}Status`]: 'processing' },
    });

    try {
      if (job.name === 'optimize') {
        if (type === 'image') {
          await import('@/lib/server/optimization/optimizer').then(m => m.optimizeImage({ assetId, tenantId, storagePath }));
        } else {
          await import('@/lib/server/optimization/optimizer').then(m => m.optimizeModel({ assetId, tenantId, storagePath }));
        }
      } else if (job.name === 'tile') {
        await import('@/lib/server/tiling/tiler').then(m => m.tileModel({ assetId, tenantId, storagePath }));
      }
    } catch (error) {
      console.error(`Worker error for job ${job.id}:`, error);
      await prisma.asset.update({
        where: { id: assetId },
        data: { [`${type === 'image' ? 'optimized' : 'tiling'}Status`]: 'failed' },
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2,
  }
);

worker.on('completed', async (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', async (job, err) => {
  if (!job) return;
  console.error(`Job ${job.id} failed:`, err);
});

export { worker };