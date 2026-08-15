import { NextRequest, NextResponse } from 'next/server';
import { getPageById, updatePageService, deletePageService, publishPageService, unpublishPageService, duplicatePage, getPageVersions, restorePageVersion } from '@/lib/server/content/content-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const page = await getPageById(id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (error) {
    console.error('Get page error:', error);
    return NextResponse.json({ error: 'Failed to get page' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const page = await updatePageService(id, body);
    return NextResponse.json(page);
  } catch (error) {
    console.error('Update page error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deletePageService(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete page' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'publish': {
        const page = await publishPageService(id);
        return NextResponse.json(page);
      }
      case 'unpublish': {
        const page = await unpublishPageService(id);
        return NextResponse.json(page);
      }
      case 'duplicate': {
        const page = await duplicatePage(id);
        return NextResponse.json(page, { status: 201 });
      }
      case 'restore': {
        const body = await request.json();
        const { versionId } = body;
        if (!versionId) {
          return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
        }
        const page = await restorePageVersion(id, versionId);
        return NextResponse.json(page);
      }
      case 'versions': {
        const versions = await getPageVersions(id);
        return NextResponse.json({ versions });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Page action error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 500 });
  }
}