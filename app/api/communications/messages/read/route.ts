import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { markAsRead } from '@/lib/communications/messaging/service';

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  await markAsRead(body.conversationId, auth.authUser.id);
  return NextResponse.json({ ok: true });
}