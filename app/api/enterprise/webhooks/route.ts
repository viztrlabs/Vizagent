import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createWebhook, getWebhooks } from '@/lib/enterprise/api/webhook-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhooks = await getWebhooks(auth.authUser.id);
  return NextResponse.json({ webhooks });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const webhook = await createWebhook(auth.authUser.id, body);
  return NextResponse.json({ webhook }, { status: 201 });
}