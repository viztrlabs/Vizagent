import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics/server';
import { getCurrentAuth } from '@/lib/auth/session';
import type { EventName, EventPropertiesMap } from '@/lib/analytics/events';

const VALID_EVENTS: EventName[] = [
  'signup_started', 'signup_completed', 'signup_failed',
  'onboarding_step_completed', 'onboarding_completed',
  'asset_uploaded', 'deployment_published',
  'checkout_started', 'checkout_completed', 'subscription_changed',
  'login_failed', 'payment_failed',
];

export async function POST(request: NextRequest) {
  const consentCookie = request.cookies.get('viztr-cookie-consent')?.value;
  if (consentCookie !== 'accepted') {
    return NextResponse.json({ error: 'Analytics consent required' }, { status: 403 });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { event, properties } = body as { event?: string; properties?: Record<string, unknown> };
  if (!event || !VALID_EVENTS.includes(event as EventName)) {
    return NextResponse.json({ error: 'Invalid event name' }, { status: 400 });
  }
  if (!properties || typeof properties !== 'object') {
    return NextResponse.json({ error: 'Properties object required' }, { status: 400 });
  }
  const { authUser, dbUser, tenantId } = await getCurrentAuth();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const sessionId = request.cookies.get('viztr-session-id')?.value ?? crypto.randomUUID();
  await trackEvent({
    event: event as EventName,
    properties: properties as unknown as EventPropertiesMap[EventName],
    userId: dbUser?.id ?? authUser.id,
    tenantId,
    sessionId,
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}