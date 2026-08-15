import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';
import {
  Page,
  Section,
  Block,
  PageStatus,
  PageVersion,
  createPage,
  createSection,
  createBlock,
  generateSlug,
  BlockType,
  BlockProps,
} from './content-model';

/* Prisma content models (M9) are not yet in the generated client; access via `db` for forward builds. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export { createBlock, createSection } from './content-model';

/**
 * M9: Content Service - CRUD operations for pages, sections, blocks
 * Handles draft/publish workflow, version history, and SEO
 */

export interface CreatePageInput {
  title: string;
  description?: string;
  slug?: string;
  sections?: SectionInput[];
  seo?: Page['seo'];
  status?: 'draft' | 'published';
  tenantId?: string;
}

export interface UpdatePageInput {
  title?: string;
  description?: string;
  slug?: string;
  sections?: SectionInput[];
  seo?: Partial<Page['seo']>;
  status?: PageStatus;
}

export interface SectionInput {
  id?: string;
  name: string;
  layout: 'container' | 'full-width' | 'split' | 'grid';
  blocks?: BlockInput[];
  background?: {
    type: 'color' | 'gradient' | 'image' | 'video';
    value: string;
    overlay?: { color: string; opacity: number };
  };
  padding?: { top: 'none' | 'sm' | 'md' | 'lg' | 'xl'; bottom: 'none' | 'sm' | 'md' | 'lg' | 'xl' };
  container?: 'default' | 'narrow' | 'wide' | 'full';
}

export interface BlockInput {
  id?: string;
  type: string;
  props: Record<string, unknown>;
  order: number;
}

/**
 * Create a new page (draft by default)
 */
export async function createPageService(input: CreatePageInput): Promise<Page> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const tenant = input.tenantId ?? tenantId;
  if (!tenant) throw new Error('Tenant ID required');

  // Generate slug if not provided
  const slug = input.slug ?? generateSlug(input.title);

  // Check slug uniqueness
  const existing = await db.page.findUnique({ where: { slug_tenantId: { slug, tenantId: tenant } } });
  if (existing) throw new Error('Slug already exists');

  // Build sections with proper ordering
  const sections = input.sections?.map((section, i) => ({
    ...section,
    order: i,
    blocks: section.blocks?.map((block, j) => ({
      ...block,
      order: j,
      id: block.id ?? crypto.randomUUID(),
    })) ?? [],
    id: section.id ?? crypto.randomUUID(),
  }));

  const page = await db.page.create({
    data: {
      title: input.title,
      description: input.description ?? '',
      slug,
      status: input.status ?? 'draft',
      seo: input.seo ?? {
        ogType: 'website',
        noIndex: false,
        noFollow: false,
      },
      sections: { create: sections },
      tenantId: tenant,
      createdBy: dbUser.id,
      updatedBy: dbUser.id,
    },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });

  // Create initial version
  await createPageVersion(page.id, 'Initial version', dbUser.id);

  await auditLog({
    action: 'page.create',
    resource: 'page',
    resourceId: page.id,
    changes: { title: page.title, slug: page.slug },
  });

  return mapPrismaPage(page);
}

/**
 * Get page by ID with sections and blocks
 */
export async function getPageById(id: string): Promise<Page | null> {
  const { tenantId } = await getCurrentAuth();
  const page = await db.page.findFirst({
    where: { id, tenantId },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });
  return page ? mapPrismaPage(page) : null;
}

/**
 * Get page by slug
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const { tenantId } = await getCurrentAuth();
  const page = await db.page.findFirst({
    where: { slug, tenantId },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });
  return page ? mapPrismaPage(page) : null;
}

/**
 * Update page
 */
export async function updatePageService(id: string, input: UpdatePageInput): Promise<Page> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const existing = await db.page.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Page not found');

  // If slug changed, check uniqueness
  if (input.slug && input.slug !== existing.slug) {
    const existingSlug = await db.page.findUnique({
      where: { slug_tenantId: { slug: input.slug, tenantId } },
    });
    if (existingSlug) throw new Error('Slug already exists');
  }

  // Build section/block updates if provided
  let sectionsUpdate: unknown;
  if (input.sections) {
    sectionsUpdate = {
      deleteMany: {},
      create: input.sections.map((section, i) => ({
        name: section.name,
        layout: section.layout,
        background: section.background,
        padding: section.padding,
        container: section.container,
        order: i,
        blocks: {
          create: section.blocks?.map((block, j) => ({
            type: block.type,
            props: block.props,
            order: j,
            id: block.id ?? crypto.randomUUID(),
          })),
        },
      })),
    };
  }

  const page = await db.page.update({
    where: { id, tenantId },
    data: {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      slug: input.slug ?? existing.slug,
      status: input.status ?? existing.status,
      seo: { ...existing.seo, ...input.seo },
      updatedBy: dbUser.id,
      version: { increment: 1 },
      sections: sectionsUpdate,
    },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });

  await createPageVersion(page.id, `Updated ${new Date().toISOString()}`, dbUser.id);

  await auditLog({
    action: 'page.update',
    resource: 'page',
    resourceId: page.id,
    changes: { title: page.title, slug: page.slug, status: page.status },
  });

  return mapPrismaPage(page);
}

/**
 * Delete page
 */
export async function deletePageService(id: string): Promise<void> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  await db.page.delete({ where: { id, tenantId } });

  await auditLog({
    action: 'page.delete',
    resource: 'page',
    resourceId: id,
  });
}

/**
 * Publish page (draft -> published)
 */
export async function publishPageService(id: string): Promise<Page> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const page = await db.page.update({
    where: { id, tenantId },
    data: {
      status: 'published',
      publishedAt: new Date(),
      version: { increment: 1 },
    },
  });

  await createPageVersion(page.id, 'Published', dbUser.id);

  await auditLog({
    action: 'page.publish',
    resource: 'page',
    resourceId: page.id,
  });

  return mapPrismaPage(page);
}

/**
 * Unpublish page (published -> draft)
 */
export async function unpublishPageService(id: string): Promise<Page> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const page = await db.page.update({
    where: { id, tenantId },
    data: { status: 'draft' },
  });

  await auditLog({
    action: 'page.unpublish',
    resource: 'page',
    resourceId: id,
  });

  return mapPrismaPage(page);
}

/**
 * Create a version snapshot of a page
 */
async function createPageVersion(pageId: string, description: string, userId: string): Promise<PageVersion> {
  const page = await db.page.findUnique({
    where: { id: pageId },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });
  if (!page) throw new Error('Page not found');

  const version = await db.pageVersion.create({
    data: {
      pageId,
      snapshot: page,
      changeDescription: description,
      createdBy: userId,
    },
  });

  return version;
}

/**
 * Get page version history
 */
export async function getPageVersions(pageId: string): Promise<PageVersion[]> {
  const { tenantId } = await getCurrentAuth();
  const page = await db.page.findFirst({ where: { id: pageId, tenantId } });
  if (!page) throw new Error('Page not found');

  return db.pageVersion.findMany({
    where: { pageId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Restore page to a previous version
 */
export async function restorePageVersion(pageId: string, versionId: string): Promise<Page> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const version = await db.pageVersion.findUnique({ where: { id: versionId } });
  if (!version || version.pageId !== pageId) throw new Error('Version not found');

  // Restore from snapshot
  const snapshot = version.snapshot as Page;
  const page = await db.page.update({
    where: { id: pageId, tenantId },
    data: {
      title: snapshot.title,
      description: snapshot.description,
      slug: snapshot.slug,
      status: snapshot.status,
      seo: snapshot.seo,
      sections: {
        deleteMany: {},
        create: snapshot.sections.map((section, i) => ({
          ...section,
          order: i,
          blocks: { create: section.blocks.map((block, j) => ({ ...block, order: j })) },
        })),
      },
      updatedBy: dbUser.id,
      version: { increment: 1 },
    },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });

  await createPageVersion(pageId, `Restored to version ${version.id}`, dbUser.id);

  await auditLog({
    action: 'page.restore',
    resource: 'page',
    resourceId: pageId,
    changes: { restoredFromVersion: versionId },
  });

  return mapPrismaPage(page);
}

/**
 * Duplicate page
 */
export async function duplicatePage(id: string): Promise<Page> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const original = await db.page.findFirst({
    where: { id, tenantId },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });
  if (!original) throw new Error('Page not found');

  const newSlug = `${original.slug}-copy-${Date.now()}`;
  const page = await db.page.create({
    data: {
      title: `${original.title} (Copy)`,
      description: original.description,
      slug: newSlug,
      status: 'draft',
      seo: original.seo,
      sections: {
        create: original.sections.map((section: SectionInput, i: number) => ({
          ...section,
          order: i,
          id: crypto.randomUUID(),
          blocks: {
            create: section.blocks?.map((block: BlockInput, j: number) => ({
              ...block,
              id: crypto.randomUUID(),
              order: j,
            })),
          },
        })),
      },
      tenantId,
      createdBy: dbUser.id,
      updatedBy: dbUser.id,
    },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });

  await auditLog({
    action: 'page.duplicate',
    resource: 'page',
    resourceId: page.id,
    changes: { originalId: id },
  });

  return mapPrismaPage(page);
}

/**
 * List pages with filters
 */
export async function listPages(filters: {
  status?: PageStatus;
  tenantId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ pages: Page[]; total: number }> {
  const { tenantId: currentTenantId } = await getCurrentAuth();
  const tenantId = filters.tenantId ?? currentTenantId;

  const where: Record<string, unknown> = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const skip = (filters.page ?? 1 - 1) * (filters.limit ?? 20);
  const take = filters.limit ?? 20;

  const [pages, total] = await Promise.all([
    db.page.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
    }),
    db.page.count({ where }),
  ]);

  return { pages: pages.map(mapPrismaPage), total };
}

/**
 * Reorder sections
 */
export async function reorderSections(pageId: string, sectionIds: string[]): Promise<void> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  await db.$transaction(
    sectionIds.map((id, index) =>
      db.section.update({
        where: { id, pageId, tenantId },
        data: { order: index },
      })
    )
  );
}

/**
 * Reorder blocks within a section
 */
export async function reorderBlocks(sectionId: string, blockIds: string[]): Promise<void> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  await db.$transaction(
    blockIds.map((id, index) =>
      db.block.update({
        where: { id, sectionId, tenantId },
        data: { order: index },
      })
    )
  );
}

/**
 * Map Prisma page to domain type
 */
function mapPrismaPage(page: Page): Page {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description,
    sections: page.sections?.map((section) => ({
      id: section.id,
      name: section.name,
      layout: section.layout,
      background: section.background,
      padding: section.padding,
      container: section.container,
      order: section.order,
      blocks: section.blocks?.map((block) => ({
        id: block.id,
        type: block.type,
        props: block.props,
        order: block.order,
      })) ?? [],
    })) ?? [],
    status: page.status,
    seo: page.seo,
    openGraph: page.openGraph,
    twitterCard: page.twitterCard,
    schemaOrg: page.schemaOrg,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt,
    createdBy: page.createdBy,
    updatedBy: page.updatedBy,
    tenantId: page.tenantId,
    version: page.version,
  };
}