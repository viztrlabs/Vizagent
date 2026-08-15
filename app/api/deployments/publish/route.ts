import { NextRequest, NextResponse } from 'next/server';
import { publishToProduction } from '@/lib/server/deployment/deployment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, mode, approvalToken } = body;

    if (!projectId || !mode || !approvalToken) {
      return NextResponse.json({ error: 'projectId, mode, and approvalToken are required' }, { status: 400 });
    }

    const validModes = ['tour', 'webxr', 'webar', 'vr', 'stream'];
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const result = await publishToProduction({ projectId, mode, environment: 'production' }, approvalToken);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Production deployment error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to publish' }, { status: 500 });
  }
}