import { z } from 'zod';

export const assetTagSchema = z.object({
  tags: z.array(z.string().min(1).max(50)).max(20),
});

export const assetUpdateTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(50)).max(20),
});
