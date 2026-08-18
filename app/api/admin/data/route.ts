import { NextResponse } from 'next/server';
import { createDataExportRequest, getDataExportRequestById, updateDataExportRequest, listDataExportRequests } from '../../../../lib/server/admin/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    // Parse query parameters
    if (searchParams.has('userId')) filters.userId = searchParams.get('userId');
    if (searchParams.has('format')) filters.format = searchParams.get('format');
    if (searchParams.has('status')) filters.status = searchParams.get('status');
    if (searchParams.has('requestedAt')) {
      const dateStr = searchParams.get('requestedAt');
      if (dateStr) {
        const [start, end] = dateStr.split(',').map((d: string) => new Date(d.trim()));
        filters.requestedAt = [start, end];
      }
    }

    const requests = await listDataExportRequests(filters);
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Failed to list data export requests:', error);
    return NextResponse.json({ error: 'Failed to fetch data export requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, format } = body;

    if (!userId || !format) {
      return NextResponse.json({ error: 'User ID and format are required' }, { status: 400 });
    }

    const requestData = await createDataExportRequest(userId, format);
    return NextResponse.json(requestData, { status: 201 });
  } catch (error) {
    console.error('Failed to create data export request:', error);
    return NextResponse.json({ error: 'Failed to create data export request' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const requestData = await updateDataExportRequest(id, updates);
    return NextResponse.json(requestData);
  } catch (error) {
    console.error('Failed to update data export request:', error);
    return NextResponse.json({ error: 'Failed to update data export request' }, { status: 500 });
  }
}

export async function GET_ONE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const requestData = await getDataExportRequestById(id);
    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(requestData);
  } catch (error) {
    console.error('Failed to get data export request:', error);
    return NextResponse.json({ error: 'Failed to fetch data export request' }, { status: 500 });
  }
}