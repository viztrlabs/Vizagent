import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createLead, getLeads } from '@/lib/server/crm/lead-service';
import { leadSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/api';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | undefined;

  const leads = await getLeads(auth.tenantId, status ?? undefined);
  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validation = validateBody(leadSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
  }

  const lead = await createLead({
    email: validation.data.email,
    name: validation.data.name,
    company: validation.data.company,
    phone: validation.data.phone,
    source: validation.data.source,
    tenantId: auth.tenantId as string,
  });
  return NextResponse.json({ lead }, { status: 201 });
}
