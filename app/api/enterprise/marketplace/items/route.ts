import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createMarketplaceItem, getMarketplaceItems, getMarketplaceItem, updateMarketplaceItem, publishMarketplaceItem, deleteMarketplaceItem } from '@/lib/enterprise/marketplace/marketplace-service';
import { MarketplaceItemStatus, MarketplaceItemType } from '@prisma/client';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || undefined;
  const status = searchParams.get('status') as MarketplaceItemStatus | undefined;
  const type = searchParams.get('type') as MarketplaceItemType | undefined;
  const creatorId = searchParams.get('creatorId') || undefined;

  if (id) {
    const item = await getMarketplaceItem(id, auth.authUser.id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item });
  }

  const items = await getMarketplaceItems(auth.authUser.id, { status, type, creatorId });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const item = await createMarketplaceItem(auth.authUser.id, auth.authUser.id, body);
  return NextResponse.json({ item }, { status: 201 });
}