import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { listAgents, getAgentStats, routeHighLevelRequest } from '@/lib/agents/agent-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const stats = searchParams.get('stats');

  if (stats === 'true') {
    return NextResponse.json({ stats: getAgentStats() });
  }

  return NextResponse.json({ agents: listAgents() });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth?.authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = await routeHighLevelRequest(
    body.request,
    '',
    auth.authUser.id,
    body.projectId,
  );

  return NextResponse.json(result, { status: 201 });
}
