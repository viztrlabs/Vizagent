import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getPageViews, getViewStats, getViewsByPath } from '@/lib/server/analytics/pageview-service';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || undefined;
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
  const stats = searchParams.get('stats');
  const topPaths = searchParams.get('topPaths');

  if (stats === 'true') {
    const viewStats = await getViewStats('', { projectId, from, to });
    return NextResponse.json({ stats: viewStats });
  }

  if (topPaths === 'true') {
    const limit = parseInt(searchParams.get('limit') || '10');
    const paths = await getViewsByPath('', limit);
    return NextResponse.json({ topPaths: paths });
  }

  const views = await getPageViews('', { projectId, from, to });
  return NextResponse.json({ views });
}
