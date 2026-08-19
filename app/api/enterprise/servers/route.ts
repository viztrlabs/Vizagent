import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createEnterpriseServer, getEnterpriseServer, updateEnterpriseServer, updateServerStatus, deleteEnterpriseServer } from '@/lib/enterprise/servers/server-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const server = await getEnterpriseServer(auth.authUser.id);
  return NextResponse.json({ server });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const server = await createEnterpriseServer(auth.authUser.id, body);
  return NextResponse.json({ server }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const body = await request.json();

  if (action === 'status') {
    const server = await updateServerStatus(auth.authUser.id, body.status, body.ipAddress);
    return NextResponse.json({ server });
  }

  const server = await updateEnterpriseServer(auth.authUser.id, body);
  return NextResponse.json({ server });
}

export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteEnterpriseServer(auth.authUser.id);
  return NextResponse.json({ ok: true });
}