import { z } from 'zod';

export const assetSchema = z.object({
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.number().positive().max(500 * 1024 * 1024), // 500MB max
  storage_path: z.string().min(1),
  thumbnail_path: z.string().optional(),
  status: z.enum(['uploaded', 'validating', 'ready', 'failed']).default('uploaded'),
});

export const uploadUrlSchema = z.object({
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.number().positive().max(500 * 1024 * 1024), // 500MB max
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

export const deploymentPreviewSchema = z.object({
  project_id: z.string().uuid(),
});

export const deploymentPublishSchema = z.object({
  project_id: z.string().uuid(),
  qa_passed: z.literal(true),
  admin_approved: z.literal(true),
});