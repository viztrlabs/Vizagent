import { NextRequest, NextResponse } from 'next/server';
import { createSection, reorderSections } from '@/lib/server/content/content-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const section = await createSection({ ...body, pageId: id });
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Create section error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create section' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reorder') {
      const { sectionIds } = await request.json();
      await reorderSections(id, sectionIds);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Section action error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}