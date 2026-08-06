import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; configId: string } }
) {
  const { id, configId } = params;
  const body = await request.json();

  const config = await prisma.configuration.update({
    where: { id: configId },
    data: { data: body.data, name: body.name },
  });

  return NextResponse.json({ config });
}
