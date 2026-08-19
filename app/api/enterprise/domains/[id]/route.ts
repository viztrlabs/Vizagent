import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { deleteCustomDomain, verifyCustomDomain, enableSsl } from '@/lib/enterprise/branding/custom-domain-service';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteCustomDomain(id, auth.authUser.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  
  if (body.action === 'verify') {
    const domain = await verifyCustomDomain(id, auth.authUser.id);
    return NextResponse.json({ domain });
  }
  
  if (body.action === 'enable_ssl') {
    const domain = await enableSsl(id, auth.authUser.id, new Date(body.expiresAt));
    return NextResponse.json({ domain });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}