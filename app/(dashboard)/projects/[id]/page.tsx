import Link from 'next/link';
import { prisma } from '@/lib/db/server';
import type { QAReport } from '@/lib/types';
import { getTenantId } from '@/lib/server/lib/tenant';
import { QARepository } from '@/lib/server/repositories/qa.repository';
import { AssetRepository } from '@/lib/server/repositories/asset.repository';
import { DeploymentRepository } from '@/lib/server/repositories/deployment.repository';
import { ProjectDetailClient } from './ProjectDetailClient';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  uploaded: 'bg-yellow-900/30 text-yellow-400',
  qa_pending: 'bg-orange-900/30 text-orange-400',
  qa_passed: 'bg-green-900/30 text-green-400',
  published: 'bg-cyan-900/30 text-cyan-400',
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getTenantId();

  const project = await prisma.project.findFirst({ where: { id, tenantId } });

  if (!project) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-2">Project not found</h1>
          <Link href="/dashboard" className="text-cyan hover:underline">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const qaRepository = new QARepository();
  const assetRepository = new AssetRepository();
  const deploymentRepository = new DeploymentRepository();

  const [latestQA, assets, deployments] = await Promise.all([
    qaRepository.findByProject(id, tenantId),
    assetRepository.findByProject(id, tenantId),
    deploymentRepository.findByProject(id, tenantId),
  ]);

  const projectData = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
  };

  const qaReport = latestQA
    ? {
        id: latestQA.id,
        qaStatus: latestQA.qaStatus,
        checks: (Array.isArray(latestQA.checks) ? latestQA.checks : []) as unknown as QAReport['checks'],
        issues: (Array.isArray(latestQA.issues) ? latestQA.issues : []) as unknown as string[],
        checkedAt: latestQA.checkedAt,
      }
    : null;

  return (
    <ProjectDetailClient
      project={projectData}
      qaReport={qaReport}
      assetCount={assets.length}
      deployments={deployments.map((d) => ({
        id: d.id,
        environment: d.environment,
        status: d.status,
        publicUrl: d.publicUrl,
        createdAt: d.createdAt,
      }))}
    />
  );
}
