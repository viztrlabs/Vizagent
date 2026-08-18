import { NextRequest, NextResponse } from 'next/server';
import { rollbackDeployment } from '@/lib/server/deployment/deployment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await rollbackDeployment(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Rollback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rollback deployment' },
      { status: 500 }
    );
  }
}