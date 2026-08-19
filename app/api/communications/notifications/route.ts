import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getNotificationHistory, getUnreadNotificationCount, markNotificationRead } from '@/lib/communications/notifications/service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (action === 'unread-count') {
    const count = await getUnreadNotificationCount(auth.authUser.id);
    return NextResponse.json({ count });
  }

  const category = searchParams.get('category') || undefined;
  const notifications = await getNotificationHistory(auth.authUser.id, { limit, offset, category });
  return NextResponse.json({ notifications });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (body.action === 'mark-read') {
    await markNotificationRead(body.notificationId, auth.authUser.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}