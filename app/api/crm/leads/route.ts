import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createLead, getLeads } from '@/lib/server/crm/lead-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | undefined;

  const leads = await getLeads('', status ?? undefined);
  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const lead = await createLead({
    email: body.email,
    name: body.name,
    company: body.company,
    phone: body.phone,
    source: body.source,
    tenantId: '',
  });
  return NextResponse.json({ lead }, { status: 201 });
}
