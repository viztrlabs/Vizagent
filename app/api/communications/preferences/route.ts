import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getUserPreferences, updateUserPreferences } from '@/lib/communications/notifications/service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prefs = await getUserPreferences(auth.authUser.id);
  return NextResponse.json({ preferences: prefs });
}

export async function PATCH(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const prefs = await updateUserPreferences(auth.authUser.id, body);
  return NextResponse.json({ preferences: prefs });
}