import { NextRequest, NextResponse } from 'next/server';
import { publishToProduction } from '@/lib/server/deployment/deployment';
import { trackEvent } from '@/lib/analytics/server';
import { getCurrentAuth } from '@/lib/auth/session';

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

    const { authUser, dbUser, tenantId } = await getCurrentAuth();
    if (authUser) {
      const sessionId = request.cookies.get('viztr-session-id')?.value ?? crypto.randomUUID();
      await trackEvent({
        event: 'deployment_published',
        properties: {
          deployment_id: projectId,
          project_id: projectId,
          xr_mode: mode as 'tour' | 'webxr' | 'web_ar' | 'vr' | 'pixel_streaming',
        },
        userId: dbUser?.id ?? authUser.id,
        tenantId,
        sessionId,
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Production deployment error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to publish' }, { status: 500 });
  }
}