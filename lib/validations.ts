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

// Booking schemas
export const bookingCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  serviceId: z.string().min(1),
  projectType: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  notes: z.string().max(1000).optional(),
});

// Communication schemas
export const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  conversationId: z.string().uuid(),
});

export const channelSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['direct', 'group', 'project']).default('group'),
});

// CRM schemas
export const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  company: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const dealSchema = z.object({
  leadId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  value: z.number().positive().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('lead'),
  notes: z.string().max(2000).optional(),
});

export const crmTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().default(false),
});

// Agent schemas
export const agentSchema = z.object({
  type: z.string().min(1),
  projectId: z.string().uuid().optional(),
  config: z.record(z.unknown()).optional(),
});

// Page schemas
export const pageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  published: z.boolean().default(false),
});

// Support ticket schema
export const supportTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().max(100).optional(),
});

// Pagination query schema
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});