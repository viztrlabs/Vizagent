import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getBrandingConfig, upsertBrandingConfig, deleteBrandingConfig } from '@/lib/enterprise/branding/branding-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const config = await getBrandingConfig(auth.authUser.id);
  return NextResponse.json({ config });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const config = await upsertBrandingConfig(auth.authUser.id, body);
  return NextResponse.json({ config }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteBrandingConfig(auth.authUser.id);
  return NextResponse.json({ ok: true });
}