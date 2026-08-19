import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getApiKey, revokeApiKey } from '@/lib/enterprise/api/api-key-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const key = await getApiKey(id, auth.authUser.id);
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ key });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await revokeApiKey(id, auth.authUser.id);
  return NextResponse.json({ ok: true });
}