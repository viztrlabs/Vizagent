import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createTask, getTasks } from '@/lib/server/crm/task-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId') || undefined;
  const dealId = searchParams.get('dealId') || undefined;
  const completed = searchParams.get('completed') !== undefined
    ? searchParams.get('completed') === 'true'
    : undefined;

  const tasks = await getTasks('', { leadId, dealId, completed });
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const task = await createTask({
    title: body.title,
    description: body.description,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    leadId: body.leadId,
    dealId: body.dealId,
    tenantId: '',
  });
  return NextResponse.json({ task }, { status: 201 });
}
