import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { ConfigurationRepository } from '@/lib/server/repositories/configuration.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';

const configurationRepository = new ConfigurationRepository();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; configId: string }> }
) {
  const { configId } = await params;
  const body = await request.json();
  const tenantId = await getTenantId();

  const existing = await withTenant(prisma, tenantId, async () =>
    configurationRepository.findById(configId, tenantId)
  );

  if (!existing) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  const config = await withTenant(prisma, tenantId, async () =>
    configurationRepository.update(configId, {
      data: body.data,
      name: body.name,
    }, tenantId)
  );

  return NextResponse.json({ config });
}
