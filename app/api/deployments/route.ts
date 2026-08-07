import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { DeploymentRepository } from '@/lib/server/repositories/deployment.repository';

const deploymentRepository = new DeploymentRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body as { projectId?: string; environment?: string };
    if (!projectId) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }

    const tenantId = await getTenantId();
    const environment = (body as { environment?: string }).environment || 'production';

    const result = await withTenant(prisma, tenantId, async () => {
      const project = await prisma.project.findUnique({ where: { id: projectId, tenantId } });
      if (!project) {
        return { status: 404 as const, body: { error: 'Project not found' } };
      }
      if (project.status !== 'qa_passed') {
        return { status: 403 as const, body: { error: 'QA must pass before publishing' } };
      }

      const deployment = await deploymentRepository.create(
        {
          projectId,
          environment,
          status: 'success',
          publicUrl: `/tour/${projectId}`,
        },
        tenantId
      );

      await prisma.project.update({
        where: { id: projectId, tenantId },
        data: { status: 'published' },
      });

      return { status: 201 as const, body: { deployment, publicUrl: deployment.publicUrl } };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'Failed to publish project' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }

    const tenantId = await getTenantId();
    const deployments = await withTenant(prisma, tenantId, () =>
      deploymentRepository.findByProject(projectId, tenantId)
    );

    return NextResponse.json({ deployments });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}
