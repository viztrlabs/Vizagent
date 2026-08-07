import { Worker } from 'bullmq';
import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/db/server';
import { withTenant } from '@/lib/server/middleware/tenant';
import { presignGetObject } from '@/lib/server/lib/r2';
import { QARepository } from '@/lib/server/repositories/qa.repository';
import { AssetRepository } from '@/lib/server/repositories/asset.repository';
import {
  checkRequiredPanorama,
  checkNaming,
  checkSizeLimit,
  checkMetadata,
  GLB_LOADABLE,
} from '@/lib/server/qa/qa-engine';
import { parseGlb } from '@/lib/server/qa/glb-loader.server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

const qaRepository = new QARepository();
const assetRepository = new AssetRepository();

async function loadGlbBytes(storagePath: string): Promise<Buffer> {
  const url = await presignGetObject(storagePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch GLB: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const worker = new Worker(
  'qa',
  async (job) => {
    const { projectId, tenantId, reportId } = job.data as {
      projectId: string;
      tenantId: string;
      reportId: string;
    };

    await withTenant(prisma, tenantId, async () => {
      const project = await prisma.project.findUnique({ where: { id: projectId, tenantId } });
      const assets = await assetRepository.findByProject(projectId, tenantId);

      if (!project) {
        await qaRepository.setReport(reportId, 'failed', [], ['Project not found'], new Date(), tenantId);
        return;
      }

      const results = [
        checkRequiredPanorama(assets),
        checkNaming(assets),
        checkSizeLimit(assets),
        checkMetadata({
          name: project.name,
          description: project.description,
          clientId: project.clientId,
        }),
      ];

      const glbAssets = assets.filter((a) => /\.glb$/i.test(a.fileName));
      if (glbAssets.length) {
        const failed: string[] = [];
        for (const glb of glbAssets) {
          try {
            const bytes = await loadGlbBytes(glb.storagePath);
            const parsed = parseGlb(bytes);
            if (!parsed.ok) throw new Error(parsed.error || 'parse failed');
          } catch (e) {
            failed.push(glb.fileName);
          }
        }
        results.push({
          name: GLB_LOADABLE,
          status: failed.length ? 'fail' : 'pass',
          message: failed.length
            ? `GLB load failed: ${failed.join(', ')}`
            : `${glbAssets.length} GLB asset(s) validated`,
        });
      }

      const issues = results.filter((r) => r.status === 'fail').map((r) => r.message);
      const qaStatus = issues.length ? 'failed' : 'passed';

      await qaRepository.setReport(reportId, qaStatus, results, issues, new Date(), tenantId);
      await qaRepository.setProjectStatus(
        projectId,
        qaStatus === 'passed' ? 'qa_passed' : 'qa_failed',
        tenantId
      );
    });
  },
  {
    connection: redis as unknown as import('bullmq').ConnectionOptions,
    concurrency: 2,
  }
);

worker.on('completed', (job) => {
  console.log(`QA job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`QA job ${job?.id} failed:`, err.message);
});

export default worker;
