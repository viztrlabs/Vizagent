import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const asset = await prisma.xrAsset.findUnique({
    where: { id },
    include: { configurations: true },
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json({ asset });
}
