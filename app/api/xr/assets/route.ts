import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/supabase/server';
import { xrAssetSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const assets = await prisma.xrAsset.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = xrAssetSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }

  const { project_id, glb_url, equirect_url, usdz_url, ...rest } = validation.data;
  const asset = await prisma.xrAsset.create({
    data: {
      ...rest,
      projectId: project_id,
      glbUrl: glb_url,
      equirectUrl: equirect_url,
      usdzUrl: usdz_url,
    },
  });

  return NextResponse.json({ asset }, { status: 201 });
}
