import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { stopTask } from '@/lib/agents/agent-service';

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const task = stopTask(body.taskId);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json({ task });
}
