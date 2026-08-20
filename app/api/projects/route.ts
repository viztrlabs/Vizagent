import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { ProjectRepository } from '@/lib/server/repositories/project.repository';
import { getCurrentAuth } from '@/lib/auth/session';
import { withTenant } from '@/lib/server/middleware/tenant';
import { projectSchema } from '@/lib/validations';

const projectRepository = new ProjectRepository();

export async function GET(request: NextRequest) {
  try {
    const { authUser, dbUser } = await getCurrentAuth();
    const tenantId = dbUser?.tenantId ?? '00000000-0000-0000-0000-000000000000';

    const projects = await withTenant(prisma, tenantId, async () =>
      projectRepository.findByClient(dbUser?.id ?? authUser?.id ?? 'demo-user', tenantId)
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

    const { authUser, dbUser } = await getCurrentAuth();
    const tenantId = dbUser?.tenantId ?? '00000000-0000-0000-0000-000000000000';
    const clientId = dbUser?.id ?? authUser?.id ?? 'demo-user';

    const project = await withTenant(prisma, tenantId, async () =>
      projectRepository.create(
        {
          name: validation.data.name,
          description: validation.data.description,
          clientId,
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
    console.error('Create project error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create project' }, { status: 500 });
  }
}
