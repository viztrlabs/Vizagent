import { NextRequest, NextResponse } from 'next/server';
import { listDeployments, getDeploymentStatus, publishToProduction } from '@/lib/server/deployment/deployment';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const deployments = await listDeployments(projectId);
    return NextResponse.json({ deployments });
  } catch (error) {
    console.error('List deployments error:', error);
    return NextResponse.json({ error: 'Failed to list deployments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, mode, approvalToken } = body;

    if (!projectId || !mode) {
      return NextResponse.json({ error: 'projectId and mode are required' }, { status: 400 });
    }

    const validModes = ['tour', 'webxr', 'webar', 'vr', 'stream'];
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    if (!approvalToken) {
      return NextResponse.json({ error: 'approvalToken is required for production deployments' }, { status: 400 });
    }

    const result = await publishToProduction({ projectId, mode, environment: 'production' }, approvalToken);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Production deployment error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to publish' }, { status: 500 });
  }
}