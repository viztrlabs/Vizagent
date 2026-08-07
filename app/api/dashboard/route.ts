import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData, type DateRange } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = (searchParams.get('range') as DateRange) || '30d';

  const validRanges: DateRange[] = ['7d', '30d', '90d', 'all'];
  if (!validRanges.includes(range)) {
    return NextResponse.json(
      { error: 'Invalid date range' },
      { status: 400 }
    );
  }

  try {
    const data = await getDashboardData(range);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}