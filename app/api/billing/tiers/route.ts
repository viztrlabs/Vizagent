import { NextResponse } from 'next/server';
import { listTiers, getTierConfig } from '@/lib/stripe/tiers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier');

  if (tier) {
    const config = getTierConfig(tier);
    if (!config) return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    return NextResponse.json({ tier: config });
  }

  return NextResponse.json({ tiers: listTiers() });
}