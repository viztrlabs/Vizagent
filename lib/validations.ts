import { z } from 'zod';

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const assetSchema = z.object({
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.number().positive().max(MAX_FILE_SIZE),
  storage_path: z.string().min(1),
  thumbnail_path: z.string().optional(),
  status: z.enum(['uploaded', 'validating', 'ready', 'failed']).default('uploaded'),
});

export const uploadUrlSchema = z.object({
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.number().positive().max(MAX_FILE_SIZE),
});

export const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  deadline: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
});

export const projectUpdateSchema = projectSchema.partial();

export const qaRunSchema = z.object({
  project_id: z.string().uuid(),
});

export const xrAssetSchema = z.object({
  project_id: z.string().uuid(),
  type: z.enum(['model3d', 'equirect']),
  service: z.enum(['vr', 'mr', 'webAR', 'tour', 'webXR']),
  glb_url: z.string().url().optional(),
  equirect_url: z.string().url().optional(),
  usdz_url: z.string().url().optional(),
});

export const configuratorSessionSchema = z.object({
  project_id: z.string().uuid(),
  host_id: z.string(),
  config: z.string(),
});

export const deploymentPreviewSchema = z.object({
  project_id: z.string().uuid(),
});

export const deploymentPublishSchema = z.object({
  project_id: z.string().uuid(),
  qa_passed: z.literal(true),
  admin_approved: z.literal(true),
});

// Asset upload multipart schemas (referenced in upload routes)
export const assetUploadInitSchema = z.object({
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.number().positive().max(MAX_FILE_SIZE),
});

export const assetUploadCompleteSchema = z.object({
  asset_id: z.string().uuid(),
  upload_id: z.string(),
  parts: z.array(
    z.object({
      etag: z.string(),
      part_number: z.number().int().positive(),
    })
  ),
});

export const assetUploadAbortSchema = z.object({
  asset_id: z.string().uuid(),
  upload_id: z.string(),
});

// Stream create schema (referenced in streams routes)
export const streamCreateSchema = z.object({
  room_id: z.string().uuid(),
  user_id: z.string(),
});