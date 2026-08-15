import { NextRequest, NextResponse } from 'next/server';
import { createPreviewDeployment } from '@/lib/server/deployment/deployment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, mode } = body;

    if (!projectId || !mode) {
      return NextResponse.json({ error: 'projectId and mode are required' }, { status: 400 });
    }

    const validModes = ['tour', 'webxr', 'webar', 'vr', 'stream'];
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const result = await createPreviewDeployment({ projectId, mode, environment: 'preview' });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Preview deployment error:', error);
    return NextResponse.json({ error: 'Failed to create preview deployment' }, { status: 500 });
  }
}