import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { addCustomDomain, getCustomDomains } from '@/lib/enterprise/branding/custom-domain-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const domains = await getCustomDomains(auth.authUser.id);
  return NextResponse.json({ domains });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const domain = await addCustomDomain(auth.authUser.id, body);
  return NextResponse.json({ domain }, { status: 201 });
}