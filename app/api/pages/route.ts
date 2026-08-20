import { NextRequest, NextResponse } from 'next/server';
import { listPages, createPageService } from '@/lib/server/content/content-service';
import type { PageStatus } from '@/lib/server/content/content-model';
import { pageSchema } from '@/lib/validations';
import { validateBody } from '@/lib/validations/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

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
    const validation = validateBody(pageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    const { title, slug, published } = validation.data;
    const page = await createPageService({ title, slug, status: published ? 'published' : 'draft' });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create page' }, { status: 500 });
  }
}