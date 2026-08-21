import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getBusinessMetrics, getLeadFunnel, getTopPerformers, getRevenueForecast } from '@/lib/server/analytics/business-metrics';

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'metrics';
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
  const projectId = searchParams.get('projectId') || undefined;
  const limit = parseInt(searchParams.get('limit') || '10');
  const months = parseInt(searchParams.get('months') || '3');

  try {
    switch (type) {
      case 'metrics': {
        const metrics = await getBusinessMetrics(auth.tenantId ?? '', { from, to, projectId });
        return NextResponse.json({ metrics });
      }
      case 'funnel': {
        const funnel = await getLeadFunnel(auth.tenantId ?? '', { from, to });
        return NextResponse.json({ funnel });
      }
      case 'top-performers': {
        const performers = await getTopPerformers(auth.tenantId ?? '', limit);
        return NextResponse.json({ performers });
      }
      case 'forecast': {
        const forecast = await getRevenueForecast(auth.tenantId ?? '', months);
        return NextResponse.json({ forecast });
      }
      default:
        return NextResponse.json({ error: 'Invalid type. Use: metrics, funnel, top-performers, or forecast' }, { status: 400 });
    }
  } catch (error) {
    console.error('Business analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}