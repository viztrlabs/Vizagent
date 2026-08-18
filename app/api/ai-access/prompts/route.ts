import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { createPrompt, getPrompts, logAiUsage, getAiUsageStats } from '@/lib/server/ai-access/prompt-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const stats = searchParams.get('stats');

  if (stats === 'true') {
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
    const usageStats = await getAiUsageStats('', { from, to });
    return NextResponse.json({ stats: usageStats });
  }

  const prompts = await getPrompts('', category);
  return NextResponse.json({ prompts });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  
  if (body._action === 'logUsage') {
    const log = await logAiUsage({
      promptSlug: body.promptSlug,
      userId: body.userId,
      inputTokens: body.inputTokens,
      outputTokens: body.outputTokens,
      latencyMs: body.latencyMs,
      success: body.success,
      error: body.error,
      tenantId: '',
    });
    return NextResponse.json({ log }, { status: 201 });
  }

  const prompt = await createPrompt({
    slug: body.slug,
    name: body.name,
    description: body.description,
    template: body.template,
    category: body.category,
    tenantId: '',
  });
  return NextResponse.json({ prompt }, { status: 201 });
}
