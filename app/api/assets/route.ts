import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { assetSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = assetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid request', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { project_id, file_name, file_type, file_size, storage_path, thumbnail_path } = validation.data;

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert({
        project_id,
        file_name,
        file_type,
        file_size,
        storage_path,
        thumbnail_path,
        status: 'uploaded',
      })
      .select()
      .single();

    if (error) {
      console.error('Asset creation error:', error);
      return NextResponse.json(
        { message: 'Failed to create asset record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ asset: data });
  } catch (error) {
    console.error('Asset creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const assetId = searchParams.get('id');

    if (assetId) {
      const { data, error } = await supabaseAdmin
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) {
        return NextResponse.json(
          { message: 'Asset not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ asset: data });
    }

    if (projectId) {
      const { data, error } = await supabaseAdmin
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { message: 'Failed to fetch assets' },
          { status: 500 }
        );
      }

      return NextResponse.json({ assets: data });
    }

    return NextResponse.json(
      { message: 'project_id or id query parameter required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Asset fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}