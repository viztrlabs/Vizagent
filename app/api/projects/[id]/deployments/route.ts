import { NextRequest, NextResponse } from 'next/server';
import { listDeployments } from '@/lib/server/deployment/deployment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deployments = await listDeployments(id);
    return NextResponse.json({ deployments });
  } catch (error) {
    console.error('List deployments error:', error);
    return NextResponse.json({ error: 'Failed to list deployments' }, { status: 500 });
  }
}
