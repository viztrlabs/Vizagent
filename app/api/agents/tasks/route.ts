import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { listTasks, dispatchTask } from '@/lib/agents/agent-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId') || undefined;
  const state = searchParams.get('state') as 'idle' | 'planning' | 'executing' | 'waiting_approval' | 'paused' | 'completed' | 'failed' | 'stopped' | undefined;

  const tasks = listTasks({ agentId, state });
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const task = await dispatchTask(
    body.agentId,
    body.type || 'execute',
    body.input || {},
    '',
    auth.authUser.id,
    body.priority || 'medium',
  );

  return NextResponse.json({ task }, { status: 201 });
}
