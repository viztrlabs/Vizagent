import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getMarketplaceItem, updateMarketplaceItem, publishMarketplaceItem, deleteMarketplaceItem } from '@/lib/enterprise/marketplace/marketplace-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const item = await getMarketplaceItem(id, auth.authUser.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  
  if (body.action === 'publish') {
    const item = await publishMarketplaceItem(id, auth.authUser.id);
    return NextResponse.json({ item });
  }

  const item = await updateMarketplaceItem(id, auth.authUser.id, body);
  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteMarketplaceItem(id, auth.authUser.id);
  return NextResponse.json({ ok: true });
}