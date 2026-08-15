import { NextRequest, NextResponse } from 'next/server';
import { createBlock, reorderBlocks } from '@/lib/server/content/content-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const block = await createBlock({ ...body, pageId: id });
    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Create block error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create block' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reorder') {
      const { blockIds } = await request.json();
      // Need sectionId for reorderBlocks - this would be passed in the body
      // const { sectionId, blockIds } = await request.json();
      // await reorderBlocks(sectionId, blockIds);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Block action error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}