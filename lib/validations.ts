import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  deadline: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
});

export const assetSchema = z.object({
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_type: z.string(),
  file_size: z.number().positive(),
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

export const streamCreateSchema = z.object({
  room_id: z.string(),
  user_id: z.string(),
});