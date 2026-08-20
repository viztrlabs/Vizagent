import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { listAgents, getAgentStats, routeHighLevelRequest } from '@/lib/agents/agent-service';
import { z } from 'zod';

const agentRequestSchema = z.object({
  request: z.string().min(1).max(5000),
  projectId: z.string().uuid().optional(),
});

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
  const result = agentRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) },
      { status: 400 }
    );
  }

  const agentResult = await routeHighLevelRequest(
    result.data.request,
    '',
    auth.authUser.id,
    result.data.projectId,
  );

  return NextResponse.json(agentResult, { status: 201 });
}
