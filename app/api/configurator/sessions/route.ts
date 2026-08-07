import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { SessionRepository } from '@/lib/server/repositories/session.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';
import { configuratorSessionSchema } from '@/lib/validations';
import { nanoid } from 'nanoid';
import { publish } from '@/lib/server/events/publisher';

const sessionRepository = new SessionRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = configuratorSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const shareToken = nanoid(10);
    const tenantId = await getTenantId();

    const session = await withTenant(prisma, tenantId, async () =>
      sessionRepository.create(
        {
          projectId: validation.data.project_id,
          hostId: validation.data.host_id,
          config: validation.data.config,
          shareToken,
        },
        tenantId
      )
    );

    await publish({
      id: nanoid(12),
      type: 'SessionStarting',
      aggregateId: session.id,
      tenantId,
      payload: {
        projectId: session.projectId,
        hostId: session.hostId,
        startAt: session.startAt,
      },
      occurredAt: new Date(),
      metadata: {},
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
