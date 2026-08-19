import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { purchaseMarketplaceItem, getMarketplacePurchases, getCreatorSales } from '@/lib/enterprise/marketplace/marketplace-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'sales') {
    const sales = await getCreatorSales(auth.authUser.id, auth.authUser.id);
    return NextResponse.json({ sales });
  }

  const purchases = await getMarketplacePurchases(auth.authUser.id, auth.authUser.id);
  return NextResponse.json({ purchases });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { purchase, item } = await purchaseMarketplaceItem(body.itemId, auth.authUser.id, auth.authUser.id);
  return NextResponse.json({ purchase, item }, { status: 201 });
}