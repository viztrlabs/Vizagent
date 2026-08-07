import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { prisma } from '@/lib/db/server';
import { DeploymentRepository } from '@/lib/server/repositories/deployment.repository';

const deploymentRepository = new DeploymentRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId();

    const deployment = await withTenant(prisma, tenantId, () =>
      deploymentRepository.findById(id, tenantId)
    );

    if (!deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    return NextResponse.json({ deployment });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deployment' }, { status: 500 });
  }
}
