import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getWebhook, updateWebhook, deleteWebhook } from '@/lib/enterprise/api/webhook-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const webhook = await getWebhook(id, auth.authUser.id);
  if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ webhook });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const webhook = await updateWebhook(id, auth.authUser.id, body);
  return NextResponse.json({ webhook });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteWebhook(id, auth.authUser.id);
  return NextResponse.json({ ok: true });
}