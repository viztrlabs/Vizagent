import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const config = await prisma.configuration.findFirst({
    where: { xrAssetId: id, name: 'default' },
  });

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

  const config = await prisma.configuration.upsert({
    where: {
      xrAssetId_name: { xrAssetId: id, name: body.name || 'default' },
    },
    update: { data: body.data },
    create: { xrAssetId: id, name: body.name || 'default', data: body.data },
  });

  return NextResponse.json({ config });
}
