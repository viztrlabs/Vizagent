import { NextRequest, NextResponse } from 'next/server';
import { getDeploymentStatus } from '@/lib/server/deployment/deployment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deployment = await getDeploymentStatus(id);

    if (!deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    return NextResponse.json({ deployment });
  } catch (error) {
    console.error('Get deployment status error:', error);
    return NextResponse.json({ error: 'Failed to fetch deployment status' }, { status: 500 });
  }
}