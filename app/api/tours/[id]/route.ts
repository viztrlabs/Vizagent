import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { mapTourConfig } from '@/lib/tour/map-tour-config';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, name, settings')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tour not found' } },
        { status: 404 }
      );
    }

    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('id, storage_path, file_type')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (assetsError) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL', message: 'Failed to fetch tour data' } },
        { status: 500 }
      );
    }

    const publicUrlFor = (storagePath: string) =>
      supabaseAdmin.storage.from('assets').getPublicUrl(storagePath).data.publicUrl;

    const tourConfig = mapTourConfig({
      project: {
        id: project.id,
        name: project.name,
        settings: project.settings,
      },
      assets: assets ?? [],
      publicUrlFor,
    });

    if (!tourConfig) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No equirectangular assets for this tour' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tourConfig });
  } catch (error) {
    console.error('Failed to fetch tour data:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to fetch tour data' } },
      { status: 500 }
    );
  }
}
