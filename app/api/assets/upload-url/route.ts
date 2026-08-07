import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { uploadUrlSchema } from '@/lib/validations';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = uploadUrlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid request', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { project_id, file_name, file_type, file_size } = validation.data;

    // Generate a unique asset ID and storage path
    const assetId = randomUUID();
    const fileExt = file_name.split('.').pop() || '';
    const storagePath = `${project_id}/${assetId}.${fileExt}`;

    // Create signed upload URL (valid for 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from('assets')
      .createSignedUploadUrl(storagePath, {
        upsert: false,
      });

    if (error) {
      console.error('Supabase signed URL error:', error);
      return NextResponse.json(
        { message: 'Failed to generate upload URL' },
        { status: 500 }
      );
    }

    // Generate public URL for the asset
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('assets')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      asset_id: assetId,
      upload_url: data.signedUrl,
      public_url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}