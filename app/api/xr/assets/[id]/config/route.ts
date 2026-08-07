import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/server';
import { ConfigurationRepository } from '@/lib/server/repositories/configuration.repository';
import { getTenantId } from '@/lib/server/lib/tenant';
import { withTenant } from '@/lib/server/middleware/tenant';

const configurationRepository = new ConfigurationRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantId = await getTenantId();

  const config = await withTenant(prisma, tenantId, async () =>
    configurationRepository.findDefault(id, tenantId)
  );

  if (!config) {
    return NextResponse.json({ error: 'No config found' }, { status: 404 });
  }

  return NextResponse.json({ config });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const tenantId = await getTenantId();

  const config = await withTenant(prisma, tenantId, async () =>
    configurationRepository.upsert(
      id,
      body.name || 'default',
      body.data,
      tenantId
    )
  );

  return NextResponse.json({ config });
}
