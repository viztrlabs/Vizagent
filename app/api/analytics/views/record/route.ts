import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/lib/server/analytics/pageview-service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const view = await recordPageView({
    path: body.path,
    projectId: body.projectId,
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    referrer: body.referrer,
    userAgent: body.userAgent,
    country: body.country,
    device: body.device,
    browser: body.browser,
    tenantId: body.tenantId || '',
  });
  return NextResponse.json({ view }, { status: 201 });
}
