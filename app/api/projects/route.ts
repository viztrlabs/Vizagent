import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { ProjectRepository } from '@/lib/server/repositories/project.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { projectSchema } from '@/lib/validations';

const projectRepository = new ProjectRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json({ error: 'client_id required' }, { status: 400 });
    }

    const tenantId = await getTenantId();
    const projects = await withTenant(prisma, tenantId, async () =>
      projectRepository.findByClient(clientId, tenantId)
    );

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = projectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const tenantId = await getTenantId();
    const project = await withTenant(prisma, tenantId, async () =>
      projectRepository.create(
        {
          name: validation.data.name,
          description: validation.data.description,
          clientId: body.client_id || 'demo-user',
          serviceType: body.service_type || 'tour',
          status: 'draft',
          settings: JSON.stringify({
            cameraHeight: 1.7,
            autoRotate: false,
            hotspotStyle: 'pin',
          }),
          budget: validation.data.budget,
          deadline: validation.data.deadline ? new Date(validation.data.deadline) : undefined,
        },
        tenantId
      )
    );

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
