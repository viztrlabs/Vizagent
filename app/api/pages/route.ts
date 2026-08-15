import { NextRequest, NextResponse } from 'next/server';
import { listPages, createPageService } from '@/lib/server/content/content-service';
import type { PageStatus } from '@/lib/server/content/content-model';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const { pages, total } = await listPages({
      status: (status as PageStatus | null) ?? undefined,
      search: search ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({ pages, total, page, limit });
  } catch (error) {
    console.error('List pages error:', error);
    return NextResponse.json({ error: 'Failed to list pages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, slug, sections, seo, status } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const page = await createPageService({ title, description, slug, sections, seo, status });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create page' }, { status: 500 });
  }
}