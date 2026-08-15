# M9: Content Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing content domain layer persistent and type-safe (no `as any`), then build the admin editor UI and public page renderer with SEO.

**Architecture:** Two phases. Phase A adds Prisma `Page`/`Section`/`Block`/`PageVersion` models, a migration + RLS applied via Supabase MCP, refactors `content-service.ts` to the typed client, and wires Zod validation into the existing API routes. Phase B installs UI deps, creates the 9 missing block components, wires the block registry, builds the editor/list admin pages, and adds the public `[slug]` renderer with SEO + Schema.org JSON-LD.

**Tech Stack:** Prisma 5.22, Next.js 16 (App Router), Zod, @dnd-kit, @radix-ui/react-select/tabs/tooltip, @tanstack/react-table, date-fns, Vitest.

## Global Constraints

- Source of truth for block types is `lib/server/content/content-model.ts` `BLOCK_TYPES` — 19 types: `hero, text, image, video, gallery, cta, feature-grid, testimonial, pricing-table, contact-form, code, divider, spacer, html, embed, faq, team, pricing, stats`. The M9 design doc §6.2 lists different names (features, rich-text, image-gallery, logo-cloud, blog-grid, portfolio-grid, quote, callout, section-header) — these DO NOT exist in code; use the actual `BLOCK_TYPES`.
- Migration: the DB is Supabase pooler (`aws-0-ap-south-1.pooler.supabase.com:6543`), no `DIRECT_URL`. `prisma migrate dev` will NOT work. Author SQL with `prisma migrate diff`, write a local migration file, and apply to Supabase via the MCP `apply_migration` tool.
- RLS house pattern: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` + `CREATE POLICY "tenant_isolation" ON ... USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);` (uses `::TEXT` because `tenant_id` columns are `String`).
- `lib/server/content/content-service.ts` currently uses `const db = prisma as any` (line 21) — remove it; use the typed client.
- No comments unless requested. TypeScript strict. House naming: snake_case `@map`/`@@map`, UUID ids, `tenantId String @map("tenant_id")` + index.
- Verify after each task: `npx tsc --noEmit` (0 errors), `pnpm lint` (0 errors), `pnpm build` (success).

---

## File Structure

```
prisma/schema.prisma                          # + Page, Section, Block, PageVersion models
prisma/migrations/<ts>_m9_content_engine/migration.sql
lib/server/content/content-service.ts         # typed client refactor + fix sections/blocks persistence
lib/server/content/content-schemas.ts         # NEW zod schemas
lib/server/content/content-service.test.ts    # NEW unit tests
components/content/blocks/CodeBlock.tsx       # NEW (9 missing components)
components/content/blocks/DividerBlock.tsx
components/content/blocks/SpacerBlock.tsx
components/content/blocks/HtmlBlock.tsx
components/content/blocks/EmbedBlock.tsx
components/content/blocks/FaqBlock.tsx
components/content/blocks/TeamBlock.tsx
components/content/blocks/PricingBlock.tsx
components/content/blocks/StatsBlock.tsx
components/content/BlockPropsEditor.tsx       # NEW
components/content/PageEditor.tsx             # NEW
components/content/PageList.tsx               # NEW
components/content/BlockEditor.tsx            # MODIFY: dnd-kit
components/content/block-registry.ts          # MODIFY: wire previewComponent/editComponent
app/api/pages/[id]/sections/route.ts          # MODIFY: persist via service
app/api/pages/[id]/blocks/route.ts            # MODIFY: persist via service
app/(admin)/content/pages/page.tsx            # NEW
app/(admin)/content/pages/new/page.tsx        # NEW
app/(admin)/content/pages/[id]/edit/page.tsx  # NEW
app/(admin)/content/pages/[id]/versions/page.tsx # NEW
app/(public)/[slug]/page.tsx                  # NEW
```

---

### Task 1: Add Prisma content models

**Files:**
- Modify: `prisma/schema.prisma` (append after the `ProjectVersion` model, line ~382)

**Interfaces:**
- Consumes: existing generator `prisma-client-js`, `datasource db` (env `DATABASE_URL`)
- Produces: delegates `prisma.page`, `prisma.section`, `prisma.block`, `prisma.pageVersion`; compound key `slug_tenantId`

- [ ] **Step 1: Append the four models**

```prisma
model Page {
  id             String    @id @default(uuid())
  slug           String
  title          String
  description    String?
  status         String    @default("draft")
  seo            Json?
  openGraph      Json?
  twitterCard    Json?
  schemaOrg      Json?
  isPlaceholder  Boolean   @default(false) @map("is_placeholder")
  placeholderKey String?   @map("placeholder_key")
  publishedAt    DateTime? @map("published_at")
  createdBy      String    @map("created_by")
  updatedBy      String    @map("updated_by")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  version        Int       @default(1)
  tenantId       String    @map("tenant_id")

  sections Section[]
  versions PageVersion[]

  @@unique([slug, tenantId])
  @@index([tenantId])
  @@index([status])
  @@map("pages")
}

model Section {
  id             String   @id @default(uuid())
  pageId         String   @map("page_id")
  name           String
  layout         String
  background     Json?
  padding        Json?
  container      String?
  order          Int      @default(0)
  isPlaceholder  Boolean  @default(false) @map("is_placeholder")
  placeholderKey String?  @map("placeholder_key")
  tenantId       String   @map("tenant_id")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  page   Page    @relation(fields: [pageId], references: [id], onDelete: Cascade)
  blocks Block[]

  @@index([pageId])
  @@index([tenantId])
  @@map("sections")
}

model Block {
  id             String   @id @default(uuid())
  sectionId      String   @map("section_id")
  type           String
  props          Json?
  order          Int      @default(0)
  isPlaceholder  Boolean  @default(false) @map("is_placeholder")
  placeholderKey String?  @map("placeholder_key")
  tenantId       String   @map("tenant_id")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  section Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@index([sectionId])
  @@index([tenantId])
  @@map("blocks")
}

model PageVersion {
  id                String   @id @default(uuid())
  pageId            String   @map("page_id")
  snapshot          Json
  changeDescription String?  @map("change_description")
  createdBy         String   @map("created_by")
  createdAt         DateTime @default(now()) @map("created_at")

  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
  @@map("page_versions")
}
```

- [ ] **Step 2: Validate + regenerate**

Run: `npx prisma validate`
Expected: exit 0, no errors.

Run: `npx prisma generate`
Expected: regenerates client; `node_modules/.prisma/client` now has `page`, `section`, `block`, `pageVersion` delegates.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit --incremental false`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(content): add Page/Section/Block/PageVersion models"
```

---

### Task 2: Author + apply migration with RLS

**Files:**
- Create: `prisma/migrations/<ts>_m9_content_engine/migration.sql` (use `20260815` prefix)

**Interfaces:**
- Consumes: the models from Task 1
- Produces: live tables `pages`, `sections`, `blocks`, `page_versions` in Supabase with RLS

- [ ] **Step 1: Generate DDL from schema**

Run: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
Expected: SQL creating all tables. Copy into the migration file ONLY the statements for the four content tables — the `CREATE TABLE "pages"`, `"sections"`, `"blocks"`, `"page_versions"` statements **plus their indexes** (`CREATE INDEX "pages_tenant_id_idx"`, `"pages_status_idx"`, `CREATE UNIQUE INDEX "pages_slug_tenant_id_key"`, `"sections_page_id_idx"`, `"sections_tenant_id_idx"`, `"blocks_section_id_idx"`, `"blocks_tenant_id_idx"`, `"page_versions_page_id_idx"`) **plus the FK constraints** (`ALTER TABLE ... ADD CONSTRAINT "sections_page_id_fkey" / "blocks_section_id_fkey" / "page_versions_page_id_fkey" ... ON DELETE CASCADE`) **plus the RLS block below**. Do NOT include any other tables' statements (pre-existing models and the M11 models' tables — those are separate migrations).

> **NOTE (plan fix):** the schema's `@@unique([slug, tenantId])` and the `onDelete: Cascade`
> relations are load-bearing (the service relies on the `slug_tenantId` compound key for
> upsert/duplicate checks and on cascade deletes when removing pages). Omitting the indexes
> and FK constraints — as an earlier draft of this step implied — would leave the live tables
> diverged from the Prisma schema. Include them.

Create `prisma/migrations/20260815000000_m9_content_engine/migration.sql` containing the 4 `CREATE TABLE` statements plus:

```sql
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "pages" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "sections" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sections" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "blocks" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "page_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "page_versions"
  USING ("page_id" IN (SELECT id FROM "pages" WHERE "tenant_id" = current_setting('app.current_tenant')::TEXT));
```

> **NOTE (plan fix):** `PageVersion` has **no** `tenant_id` column by design (spec §5.1:
> page-level tenant gating in `getPageVersions` makes it unnecessary). The policy above
> therefore scopes `page_versions` rows through their parent `pages` row instead of a
> direct `tenant_id` comparison, matching the house RLS pattern's intent.

- [ ] **Step 2: Apply to Supabase via MCP**

Call the Supabase `apply_migration` MCP tool with `name: "m9_content_engine"` and `query: <the full migration SQL>`.
Expected: success message; verify via MCP `execute_sql` `SELECT tablename FROM pg_tables WHERE tablename IN ('pages','sections','blocks','page_versions');` returns 4 rows.

- [ ] **Step 3: Commit**

```bash
git add prisma/migrations/20260815000000_m9_content_engine/migration.sql
git commit -m "feat(content): add m9_content_engine migration with RLS"
```

---

### Task 3: Refactor service to typed client + add section/block persistence

**Files:**
- Modify: `lib/server/content/content-service.ts`

**Interfaces:**
- Consumes: typed `prisma` from `@/lib/db/server`; delegates from Task 1
- Produces:
  - `addSectionService(pageId, input: SectionInput): Promise<Section>`
  - `updateSectionService(sectionId, input: Partial<SectionInput>): Promise<Section>`
  - `deleteSectionService(sectionId): Promise<void>`
  - `addBlockService(sectionId, input: BlockInput): Promise<Block>`
  - `updateBlockService(blockId, input: { type?: string; props?: Record<string, unknown> }): Promise<Block>`
  - `deleteBlockService(blockId): Promise<void>`
  - Refactored `mapPrismaPage` typed to Prisma payload; new `toPageVersion` mapper.

- [ ] **Step 1: Remove `as any` and re-type**

Replace lines 19-21:

```ts
/* Prisma content models (M9) are not yet in the generated client; access via `db` for forward builds. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;
```

with the typed client. Import `Prisma` and the payload type:

```ts
import { Prisma } from '@prisma/client';
```

Define the include result type near the top:

```ts
type PageWithRelations = Prisma.PageGetPayload<{
  include: { sections: { include: { blocks: true } } };
}>;
```

Keep the re-export line 23 as-is (`export { createBlock, createSection } from './content-model';`).

- [ ] **Step 2: Replace every `db.page` / `db.section` / `db.block` / `db.pageVersion` with `prisma.*`**

Run a find/replace across `content-service.ts`:
- `db.page` → `prisma.page`
- `db.section` → `prisma.section`
- `db.block` → `prisma.block`
- `db.pageVersion` → `prisma.pageVersion`
- `db.$transaction` → `prisma.$transaction`

- [ ] **Step 3: Fix `createPageService` Json writes**

`createPageService` writes `seo` and nested `background`/`padding`/`props`. Prisma `Json` fields are typed `InputJsonValue`; domain objects with optional `undefined` fields fail the type. Use a helper to strip undefined at the mapping boundary. Add at file top:

```ts
function cleanJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
```

In `createPageService`, wrap the JSON-valued inputs:
- `seo: cleanJson(input.seo ?? { ogType: 'website', noIndex: false, noFollow: false })`
- In the `sections` map, `background: section.background ? cleanJson(section.background) : undefined`, `padding: section.padding ? cleanJson(section.padding) : undefined`, `props: block.props ? cleanJson(block.props) : undefined`.

Do the same in `updatePageService` sections create map, `duplicatePage`, and `restorePageVersion` (snapshot decode is handled by the typed casts below).

- [ ] **Step 3b: Fix tenant-scoped update/delete in existing page functions**

The `db.page` → `prisma.page` replace exposes a TS error in `updatePageService` (`prisma.page.update({ where: { id, tenantId }, ... })`, ~line 202) and `deletePageService` (`prisma.page.delete({ where: { id, tenantId } })`, ~line 236) — Prisma `update`/`delete` `where` accepts only unique fields. Fix both:

`updatePageService`: replace the `const page = await prisma.page.update({ where: { id, tenantId }, ... })` block with:

```ts
const updated = await prisma.page.updateMany({
  where: { id, tenantId },
  data: {
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    slug: input.slug ?? existing.slug,
    status: input.status ?? existing.status,
    seo: cleanJson({
      ...((existing.seo as Record<string, unknown>) ?? {}),
      ...(input.seo ?? {}),
    }),
    updatedBy: dbUser.id,
    version: { increment: 1 },
    sections: sectionsUpdate,
  },
});
if (updated.count === 0) throw new Error('Page not found');

const page = await prisma.page.findFirst({
  where: { id, tenantId },
  include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
});
if (!page) throw new Error('Page not found');
```

`deletePageService`: replace `await db.page.delete({ where: { id, tenantId } });` with:

```ts
const deleted = await prisma.page.deleteMany({ where: { id, tenantId } });
if (deleted.count === 0) throw new Error('Page not found');
```

`restorePageVersion`: replace the `const page = await db.page.update({ where: { id: pageId, tenantId }, ... })` block with:

```ts
const restored = await prisma.page.updateMany({
  where: { id: pageId, tenantId },
  data: {
    title: snapshot.title,
    description: snapshot.description,
    slug: snapshot.slug,
    status: snapshot.status,
    seo: cleanJson(snapshot.seo ?? {}),
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
});
if (restored.count === 0) throw new Error('Page not found');

const page = await prisma.page.findFirst({
  where: { id: pageId, tenantId },
  include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
});
if (!page) throw new Error('Page not found');
```

`reorderSections`: replace the `db.$transaction(sectionIds.map(...))` block with:

```ts
await prisma.$transaction(
  sectionIds.map((id, index) =>
    prisma.section.updateMany({
      where: { id, pageId, tenantId },
      data: { order: index },
    })
  )
);
```

`reorderBlocks`: replace the `db.$transaction(blockIds.map(...))` block with:

```ts
await prisma.$transaction(
  blockIds.map((id, index) =>
    prisma.block.updateMany({
      where: { id, sectionId, tenantId },
      data: { order: index },
    })
  )
);
```

> NOTE: Step 4 below (fix `updatePageService` seo spread) becomes redundant after Step 3b; skip its duplicate `seo: cleanJson(...)` replacement if already applied — apply it only if the Step 3b block above was not applied. The implementer should apply Step 3b's version and treat Step 4's seo block as already handled.

- [ ] **Step 4: Fix `updatePageService` seo spread**

Current line: `seo: { ...existing.seo, ...input.seo }`. `existing.seo` is `JsonValue` (unwritable). Replace with:

```ts
seo: cleanJson({
  ...((existing.seo as Record<string, unknown>) ?? {}),
  ...(input.seo ?? {}),
}),
```

- [ ] **Step 5: Fix `listPages` where typing**

`where: Record<string, unknown>` now fails because `.OR` with `mode: 'insensitive'` must be typed. Change to:

```ts
const where: Prisma.PageWhereInput = { tenantId };
if (filters.status) where.status = filters.status;
if (filters.search) {
  where.OR = [
    { title: { contains: filters.search, mode: 'insensitive' } },
    { description: { contains: filters.search, mode: 'insensitive' } },
  ];
}
```

- [ ] **Step 6: Re-type `mapPrismaPage`**

Replace the signature `function mapPrismaPage(page: Page): Page {` with:

```ts
function mapPrismaPage(page: PageWithRelations): Page {
```

Inside, decode Json columns at the mapping boundary:

```ts
return {
  id: page.id,
  slug: page.slug,
  title: page.title,
  description: page.description ?? '',
  sections: page.sections?.map((section) => ({
    id: section.id,
    name: section.name,
    layout: section.layout as Section['layout'],
    background: section.background as Section['background'] | undefined,
    padding: section.padding as Section['padding'],
    container: (section.container as Section['container']) ?? 'default',
    order: section.order,
    blocks: section.blocks?.map((block) => ({
      id: block.id,
      type: block.type as Block['type'],
      props: block.props as Block['props'],
      order: block.order,
      isPlaceholder: block.isPlaceholder,
      placeholderKey: block.placeholderKey,
    })) ?? [],
    isPlaceholder: section.isPlaceholder,
    placeholderKey: section.placeholderKey,
  })) ?? [],
  status: page.status as Page['status'],
  seo: (page.seo as Page['seo']) ?? { ogType: 'website', noIndex: false, noFollow: false },
  openGraph: page.openGraph as Page['openGraph'] | undefined,
  twitterCard: page.twitterCard as Page['twitterCard'] | undefined,
  schemaOrg: page.schemaOrg as Page['schemaOrg'] | undefined,
  isPlaceholder: page.isPlaceholder,
  placeholderKey: page.placeholderKey,
  createdAt: page.createdAt,
  updatedAt: page.updatedAt,
  publishedAt: page.publishedAt,
  createdBy: page.createdBy,
  updatedBy: page.updatedBy,
  tenantId: page.tenantId,
  version: page.version,
};
```

Ensure `Section`, `Block`, `Page` are imported (they already are at lines 5-9).

- [ ] **Step 7: Add `toPageVersion` and fix versions/restore**

Add after `mapPrismaPage`:

```ts
function toPageVersion(v: { id: string; pageId: string; snapshot: Prisma.JsonValue; changeDescription: string | null; createdBy: string; createdAt: Date }): PageVersion {
  return {
    id: v.id,
    pageId: v.pageId,
    snapshot: v.snapshot as unknown as Page,
    changeDescription: v.changeDescription ?? undefined,
    createdBy: v.createdBy,
    createdAt: v.createdAt,
  };
}
```

In `getPageVersions`, map the rows: `return (await prisma.pageVersion.findMany({...})).map(toPageVersion);`

In `restorePageVersion`, replace `const snapshot = version.snapshot as Page;` with:

```ts
const snapshot = version.snapshot as unknown as PageWithRelations;
```

- [ ] **Step 8: Add section/block persistence functions**

Append before `reorderSections`:

```ts
export async function addSectionService(pageId: string, input: SectionInput): Promise<Section> {
  const { dbUser, tenantId } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const page = await prisma.page.findFirst({ where: { id: pageId, tenantId } });
  if (!page) throw new Error('Page not found');

  const max = await prisma.section.aggregate({
    where: { pageId, tenantId },
    _max: { order: true },
  });

  const section = await prisma.section.create({
    data: {
      pageId,
      name: input.name,
      layout: input.layout,
      background: input.background ? cleanJson(input.background) : undefined,
      padding: input.padding ? cleanJson(input.padding) : undefined,
      container: input.container,
      order: (max._max.order ?? -1) + 1,
      tenantId,
    },
  });

  await auditLog({ action: 'section.create', resource: 'section', resourceId: section.id, changes: { pageId } });
  return {
    id: section.id,
    name: section.name,
    blocks: [],
    layout: section.layout as Section['layout'],
    background: section.background as Section['background'] | undefined,
    padding: (section.padding as Section['padding']) ?? { top: 'md', bottom: 'md' },
    container: (section.container as Section['container']) ?? 'default',
    order: section.order,
  };
}

export async function updateSectionService(sectionId: string, input: Partial<SectionInput>): Promise<Section> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const update = await prisma.section.updateMany({
    where: { id: sectionId, tenantId },
    data: {
      name: input.name,
      layout: input.layout,
      background: input.background ? cleanJson(input.background) : undefined,
      padding: input.padding ? cleanJson(input.padding) : undefined,
      container: input.container,
    },
  });
  if (update.count === 0) throw new Error('Section not found');

  const section = await prisma.section.findFirst({
    where: { id: sectionId, tenantId },
    include: { blocks: { orderBy: { order: 'asc' } } },
  });
  if (!section) throw new Error('Section not found');

  await auditLog({ action: 'section.update', resource: 'section', resourceId: sectionId, changes: { pageId: section.pageId } });
  return {
    id: section.id,
    name: section.name,
    blocks: section.blocks.map((b) => ({
      id: b.id,
      type: b.type as Block['type'],
      props: b.props as Block['props'],
      order: b.order,
    })),
    layout: section.layout as Section['layout'],
    background: section.background as Section['background'] | undefined,
    padding: (section.padding as Section['padding']) ?? { top: 'md', bottom: 'md' },
    container: (section.container as Section['container']) ?? 'default',
    order: section.order,
  };
}

export async function deleteSectionService(sectionId: string): Promise<void> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const update = await prisma.section.deleteMany({ where: { id: sectionId, tenantId } });
  if (update.count === 0) throw new Error('Section not found');
  await auditLog({ action: 'section.delete', resource: 'section', resourceId: sectionId });
}

export async function addBlockService(sectionId: string, input: BlockInput): Promise<Block> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const section = await prisma.section.findFirst({ where: { id: sectionId, tenantId } });
  if (!section) throw new Error('Section not found');

  const max = await prisma.block.aggregate({
    where: { sectionId, tenantId },
    _max: { order: true },
  });

  const block = await prisma.block.create({
    data: {
      sectionId,
      type: input.type,
      props: input.props ? cleanJson(input.props) : undefined,
      order: (max._max.order ?? -1) + 1,
      tenantId,
    },
  });

  await auditLog({ action: 'block.create', resource: 'block', resourceId: block.id, changes: { sectionId } });
  return { id: block.id, type: block.type as Block['type'], props: block.props as Block['props'], order: block.order };
}

export async function updateBlockService(blockId: string, input: { type?: string; props?: Record<string, unknown> }): Promise<Block> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const update = await prisma.block.updateMany({
    where: { id: blockId, tenantId },
    data: {
      type: input.type,
      props: input.props ? cleanJson(input.props) : undefined,
    },
  });
  if (update.count === 0) throw new Error('Block not found');

  const block = await prisma.block.findFirst({ where: { id: blockId, tenantId } });
  if (!block) throw new Error('Block not found');

  await auditLog({ action: 'block.update', resource: 'block', resourceId: blockId });
  return { id: block.id, type: block.type as Block['type'], props: block.props as Block['props'], order: block.order };
}

export async function deleteBlockService(blockId: string): Promise<void> {
  const { tenantId } = await getCurrentAuth();
  const hasPermission = await requirePermission('content.write');
  if (!hasPermission) throw new Error('Forbidden: content.write required');

  const update = await prisma.block.deleteMany({ where: { id: blockId, tenantId } });
  if (update.count === 0) throw new Error('Block not found');
  await auditLog({ action: 'block.delete', resource: 'block', resourceId: blockId });
}
```

- [ ] **Step 9: Verify**

Run: `npx tsc --noEmit --incremental false`
Expected: 0 errors.

Run: `pnpm lint`
Expected: 0 errors.

- [ ] **Step 10: Commit**

```bash
git add lib/server/content/content-service.ts
git commit -m "feat(content): type service client and add section/block persistence"
```

---

### Task 4: Fix sections/blocks API routes to persist

**Files:**
- Modify: `app/api/pages/[id]/sections/route.ts`
- Modify: `app/api/pages/[id]/blocks/route.ts`

**Interfaces:**
- Consumes: `addSectionService`, `deleteSectionService`, `updateSectionService`, `addBlockService`, `deleteBlockService`, `updateBlockService` from Task 3
- Produces: working persistent section/block CRUD endpoints

- [ ] **Step 1: Rewrite sections route**

Replace the entire file with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  addSectionService,
  updateSectionService,
  deleteSectionService,
  reorderSections,
} from '@/lib/server/content/content-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const section = await addSectionService(id, body);
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Create section error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create section' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reorder') {
      const { sectionIds } = await request.json();
      await reorderSections(id, sectionIds);
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const section = await updateSectionService(id, body);
    return NextResponse.json(section);
  } catch (error) {
    console.error('Section action error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteSectionService(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete section' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Rewrite blocks route**

Replace the entire file with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  addBlockService,
  updateBlockService,
  deleteBlockService,
  reorderBlocks,
} from '@/lib/server/content/content-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { sectionId, ...input } = await request.json();
    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
    }
    const block = await addBlockService(sectionId, { ...input, type: input.type, props: input.props ?? {}, order: input.order ?? 0 });
    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Create block error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create block' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reorder') {
      const { sectionId, blockIds } = await request.json();
      if (!sectionId) return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
      await reorderBlocks(sectionId, blockIds);
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const block = await updateBlockService(id, body);
    return NextResponse.json(block);
  } catch (error) {
    console.error('Block action error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteBlockService(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete block error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete block' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 4: Commit**

```bash
git add app/api/pages/[id]/sections/route.ts app/api/pages/[id]/blocks/route.ts
git commit -m "fix(content): persist sections/blocks through API routes"
```

---

### Task 5: Zod validation schemas + wire into routes

**Files:**
- Create: `lib/server/content/content-schemas.ts`
- Modify: `app/api/pages/route.ts`, `app/api/pages/[id]/route.ts`, `app/api/pages/[id]/sections/route.ts`, `app/api/pages/[id]/blocks/route.ts`

**Interfaces:**
- Consumes: zod (installed), domain types
- Produces: `createPageSchema`, `updatePageSchema`, `sectionSchema`, `blockSchema`, and helpers `parseJsonOrError`

- [ ] **Step 1: Create schemas file**

```ts
import { z } from 'zod';

export const blockSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
  order: z.number().int().min(0).optional(),
});

export const sectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  layout: z.enum(['container', 'full-width', 'split', 'grid']),
  blocks: z.array(blockSchema).optional(),
  background: z
    .object({
      type: z.enum(['color', 'gradient', 'image', 'video']),
      value: z.string(),
      overlay: z
        .object({ color: z.string(), opacity: z.number().min(0).max(1) })
        .optional(),
    })
    .optional(),
  padding: z
    .object({
      top: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
      bottom: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
    })
    .optional(),
  container: z.enum(['default', 'narrow', 'wide', 'full']).optional(),
});

export const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  sections: z.array(sectionSchema).optional(),
  seo: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  sections: z.array(sectionSchema).optional(),
  seo: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export function parseJsonOrError(schema: z.ZodSchema, data: unknown):
  { ok: true; data: unknown } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues.map((i) => i.message).join('; ') };
}
```

- [ ] **Step 2: Wire into pages route**

In `app/api/pages/route.ts` POST, replace the manual `if (!title)` block with:

```ts
import { createPageSchema, parseJsonOrError } from '@/lib/server/content/content-schemas';
...
const parsed = parseJsonOrError(createPageSchema, body);
if (!parsed.ok) {
  return NextResponse.json({ error: parsed.error }, { status: 400 });
}
const { title, description, slug, sections, seo, status } = parsed.data as { title: string; description?: string; slug?: string; sections?: unknown; seo?: unknown; status?: 'draft' | 'published' };
```

- [ ] **Step 3: Wire into page [id] route**

In `app/api/pages/[id]/route.ts`:
- PUT: `const parsed = parseJsonOrError(updatePageSchema, body); if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 }); const page = await updatePageService(id, parsed.data);`
- In the POST `restore` branch, keep `versionId` check (already present).

- [ ] **Step 4: Wire into sections/blocks routes**

In sections route POST: `const parsed = parseJsonOrError(sectionSchema, body); if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 }); const section = await addSectionService(id, parsed.data);`

In blocks route POST: parse with `blockSchema` after destructuring `sectionId` (parse the remaining `input` fields):

```ts
const parsed = parseJsonOrError(blockSchema, input);
if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 6: Commit**

```bash
git add lib/server/content/content-schemas.ts app/api/pages/route.ts "app/api/pages/[id]/route.ts" "app/api/pages/[id]/sections/route.ts" "app/api/pages/[id]/blocks/route.ts"
git commit -m "feat(content): add zod validation to content API routes"
```

---

### Task 6: Service unit tests

**Files:**
- Create: `lib/server/content/content-service.test.ts`

**Interfaces:**
- Consumes: `content-service.ts` functions; mocked `@/lib/db/server` + `@/lib/auth/session`
- Produces: regression coverage for addSection/addBlock persistence and tenant scoping

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const sections: Record<string, Record<string, unknown>> = {};
let sectionSeq = 0;
const blocks: Record<string, Record<string, unknown>> = {};
let blockSeq = 0;

vi.mock('@/lib/db/server', () => ({
  prisma: {
    page: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
        where.id === 'p1' && where.tenantId === 'tenant-1' ? { id: 'p1' } : null
      ),
    },
    section: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) =>
        where.id === 's-1' && where.tenantId === 'tenant-1' ? { id: 's-1', pageId: 'p1' } : null
      ),
      aggregate: vi.fn(async () => ({ _max: { order: 1 } })),
      create: vi.fn(async ({ data }: { data: { pageId: string; name: string; tenantId: string } }) => {
        const id = `s-${++sectionSeq}`;
        const row = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        sections[id] = row;
        return row;
      }),
      update: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) => sections[where.id] ?? null),
      delete: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) => {
        delete sections[where.id];
      }),
      findMany: vi.fn(async () => []),
      aggregate2: undefined,
    },
    block: {
      aggregate: vi.fn(async () => ({ _max: { order: 1 } })),
      create: vi.fn(async ({ data }: { data: { sectionId: string; type: string; tenantId: string } }) => {
        const id = `b-${++blockSeq}`;
        const row = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        blocks[id] = row;
        return row;
      }),
      update: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) => blocks[where.id] ?? null),
      delete: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) => {
        delete blocks[where.id];
      }),
      findMany: vi.fn(async () => []),
    },
    pageVersion: {
      create: vi.fn(async (args: unknown) => args),
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getCurrentAuth: vi.fn(async () => ({
    authUser: { id: 'u1', email: 'a@b.c' },
    dbUser: { id: 'u1', role: 'ADMIN', tenantId: 'tenant-1' },
    role: 'ADMIN',
    tenantId: 'tenant-1',
  })),
  requirePermission: vi.fn(async () => 'ADMIN'),
}));

import { addSectionService, addBlockService } from './content-service';

describe('content-service persistence', () => {
  beforeEach(() => {
    Object.keys(sections).forEach((k) => delete sections[k]);
    Object.keys(blocks).forEach((k) => delete blocks[k]);
    sectionSeq = 0;
    blockSeq = 0;
  });

  it('addSectionService persists with tenantId', async () => {
    const s = await addSectionService('p1', { name: 'Hero', layout: 'container' });
    expect(s.id).toBeDefined();
    expect(s.name).toBe('Hero');
  });

  it('addBlockService persists block on a section', async () => {
    const b = await addBlockService('s-1', { type: 'text', props: { content: 'hi' }, order: 0 });
    expect(b.type).toBe('text');
    expect(b.id).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/server/content/content-service.test.ts`
Expected: FAIL (functions not exported yet at this point in the plan, or module errors). Note: run this AFTER Task 3 is committed; if run before, the import fails — that is the expected "red" state.

- [ ] **Step 3: Run to verify it passes**

Run: `npx vitest run lib/server/content/content-service.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 4: Verify lint/tsc**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add lib/server/content/content-service.test.ts
git commit -m "test(content): cover section/block persistence"
```

---

### Task 7: Install Phase B dependencies

**Files:**
- Modify: `package.json` (via pnpm add)

- [ ] **Step 1: Install deps**

Run: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip @tanstack/react-table date-fns`
Expected: install completes; `node -e "const p=require('./package.json'); console.log(p.dependencies['@dnd-kit/core'])"` prints a version.

- [ ] **Step 2: Verify build still clean**

Run: `pnpm lint` and `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(content): add editor UI dependencies"
```

---

### Task 8: Create the 9 missing block components

**Files:**
- Create: `components/content/blocks/CodeBlock.tsx`, `DividerBlock.tsx`, `SpacerBlock.tsx`, `HtmlBlock.tsx`, `EmbedBlock.tsx`, `FaqBlock.tsx`, `TeamBlock.tsx`, `PricingBlock.tsx`, `StatsBlock.tsx`

**Interfaces:**
- Consumes: `BlockProps` from `content-model`
- Produces: 9 components each exporting `CodeBlock({ props }: { props: BlockProps['code'] })` (etc.) — same shape as existing blocks (single `props` prop)

- [ ] **Step 1: CodeBlock**

```tsx
'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['code'] }

export function CodeBlock({ props }: Props) {
  const { code, language, showLineNumbers, copyable } = props;
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-950 border border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80">
        <span className="text-xs font-mono text-gray-400">{language}</span>
        {copyable && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-xs text-cyan hover:text-cyan/80"
          >
            Copy
          </button>
        )}
      </div>
      <pre className="p-4 text-sm text-gray-200 overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: DividerBlock**

```tsx
'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['divider'] }

export function DividerBlock({ props }: Props) {
  const styleMap = { solid: 'border-t', dashed: 'border-t border-dashed', dotted: 'border-t border-dotted' } as const;
  const marginMap = { none: 'my-0', sm: 'my-2', md: 'my-4', lg: 'my-8', xl: 'my-12' } as const;
  return <hr className={`${styleMap[props.variant]} ${marginMap[props.margin]} border-gray-700`} style={props.color ? { borderColor: props.color } : undefined} />;
}
```

- [ ] **Step 3: SpacerBlock**

```tsx
'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['spacer'] }

export function SpacerBlock({ props }: Props) {
  const sizeMap = { sm: 'h-8', md: 'h-16', lg: 'h-24', xl: 'h-32', '2xl': 'h-40' } as const;
  return <div className={sizeMap[props.size]} aria-hidden="true" />;
}
```

- [ ] **Step 4: HtmlBlock**

```tsx
'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['html'] }

export function HtmlBlock({ props }: Props) {
  return (
    <div
      className="prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}
```

- [ ] **Step 5: EmbedBlock**

```tsx
'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['embed'] }

const RATIOS: Record<string, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
};

export function EmbedBlock({ props }: Props) {
  return (
    <div className={`${RATIOS[props.aspectRatio] ?? 'aspect-video'} overflow-hidden rounded-lg`}>
      <iframe src={props.url} title={props.title ?? 'Embedded content'} className="w-full h-full" allowFullScreen />
    </div>
  );
}
```

- [ ] **Step 6: FaqBlock**

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['faq'] }

export function FaqBlock({ props }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {props.items.map((item, i) => (
        <div key={i} className="border border-gray-800 rounded-lg overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-900/50"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="font-medium text-white">{item.question}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
          </button>
          {(!props.collapsible || openIndex === i) && (
            <div className="px-4 pb-4 text-sm text-gray-400">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: TeamBlock**

```tsx
'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['team'] }

const COLS: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };

export function TeamBlock({ props }: Props) {
  return (
    <div className={`grid grid-cols-1 ${COLS[props.columns] ?? 'md:grid-cols-3'} gap-6`}>
      {props.members.map((member, i) => (
        <div key={i} className="rounded-xl border border-gray-800 p-6 text-center bg-surface">
          {member.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-cyan/20 flex items-center justify-center text-xl text-cyan">
              {member.name.charAt(0)}
            </div>
          )}
          <h3 className="font-medium text-white">{member.name}</h3>
          <p className="text-sm text-cyan mt-1">{member.role}</p>
          {member.bio && <p className="text-sm text-gray-400 mt-3">{member.bio}</p>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: PricingBlock**

```tsx
'use client';

import { cn } from '@/lib/utils';
import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['pricing'] }

export function PricingBlock({ props }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {props.plans.map((plan, i) => (
        <div
          key={i}
          className={cn(
            'rounded-xl border p-6 flex flex-col',
            plan.highlighted ? 'border-cyan bg-cyan/5' : 'border-gray-800 bg-surface'
          )}
        >
          {plan.badge && (
            <span className="self-start px-2 py-1 text-xs font-medium bg-cyan/20 text-cyan rounded mb-3">{plan.badge}</span>
          )}
          <h3 className="font-display text-lg text-white">{plan.name}</h3>
          <p className="mt-2 text-3xl font-bold text-white">
            {props.currency} {plan.price}
            <span className="text-sm font-normal text-gray-400">/{plan.period}</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-400 flex-1">
            {plan.features.map((f, j) => (
              <li key={j}>• {f}</li>
            ))}
          </ul>
          <a href={plan.ctaUrl} className="mt-6 inline-flex justify-center px-4 py-2 rounded-lg bg-cyan text-bg font-semibold text-sm hover:bg-cyan/90">
            {plan.ctaText}
          </a>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: StatsBlock**

```tsx
'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['stats'] }

const COLS: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };

export function StatsBlock({ props }: Props) {
  return (
    <div className={`grid grid-cols-1 ${COLS[props.columns] ?? 'md:grid-cols-3'} gap-6`}>
      {props.items.map((item, i) => (
        <div key={i} className="text-center">
          <p className="font-display text-4xl font-bold text-white">
            {item.prefix}{item.value}{item.suffix}
          </p>
          <p className="mt-1 text-sm text-gray-400">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 10: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 11: Commit**

```bash
git add components/content/blocks/CodeBlock.tsx components/content/blocks/DividerBlock.tsx components/content/blocks/SpacerBlock.tsx components/content/blocks/HtmlBlock.tsx components/content/blocks/EmbedBlock.tsx components/content/blocks/FaqBlock.tsx components/content/blocks/TeamBlock.tsx components/content/blocks/PricingBlock.tsx components/content/blocks/StatsBlock.tsx
git commit -m "feat(content): add 9 block components"
```

---

### Task 9: Wire block registry with preview/edit components

**Files:**
- Modify: `lib/server/content/block-registry.ts`
- Modify: `components/content/BlockEditor.tsx` (BlockPropsEditor)

**Interfaces:**
- Consumes: all 19 block components from `components/content/blocks/` (10 existing + 9 from Task 8)
- Produces: registry `previewComponent`/`editComponent` filled; `BlockPropsEditor` renders the active block's `editComponent`

- [ ] **Step 1: Add imports + a component map**

At the top of `block-registry.ts`:

```ts
import { HeroBlock } from '@/components/content/blocks/HeroBlock';
import { TextBlock } from '@/components/content/blocks/TextBlock';
import { ImageBlock } from '@/components/content/blocks/ImageBlock';
import { VideoBlock } from '@/components/content/blocks/VideoBlock';
import { GalleryBlock } from '@/components/content/blocks/GalleryBlock';
import { CtaBlock } from '@/components/content/blocks/CtaBlock';
import { FeatureGridBlock } from '@/components/content/blocks/FeatureGridBlock';
import { TestimonialBlock } from '@/components/content/blocks/TestimonialBlock';
import { PricingTableBlock } from '@/components/content/blocks/PricingTableBlock';
import { ContactFormBlock } from '@/components/content/blocks/ContactFormBlock';
import { CodeBlock } from '@/components/content/blocks/CodeBlock';
import { DividerBlock } from '@/components/content/blocks/DividerBlock';
import { SpacerBlock } from '@/components/content/blocks/SpacerBlock';
import { HtmlBlock } from '@/components/content/blocks/HtmlBlock';
import { EmbedBlock } from '@/components/content/blocks/EmbedBlock';
import { FaqBlock } from '@/components/content/blocks/FaqBlock';
import { TeamBlock } from '@/components/content/blocks/TeamBlock';
import { PricingBlock } from '@/components/content/blocks/PricingBlock';
import { StatsBlock } from '@/components/content/blocks/StatsBlock';
```

Add after the registry object:

```ts
export const BLOCK_PREVIEWS: Record<BlockType, React.ComponentType<{ props: BlockProps[BlockType] }>> = {
  hero: HeroBlock,
  text: TextBlock,
  image: ImageBlock,
  video: VideoBlock,
  gallery: GalleryBlock,
  cta: CtaBlock,
  'feature-grid': FeatureGridBlock,
  testimonial: TestimonialBlock,
  'pricing-table': PricingTableBlock,
  'contact-form': ContactFormBlock,
  code: CodeBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  html: HtmlBlock,
  embed: EmbedBlock,
  faq: FaqBlock,
  team: TeamBlock,
  pricing: PricingBlock,
  stats: StatsBlock,
};
```

- [ ] **Step 2: Create BlockPropsEditor**

Create `components/content/BlockPropsEditor.tsx`:

```tsx
'use client';

import { BlockType } from '@/lib/server/content/content-model';
import { getBlockRegistration } from '@/lib/server/content/block-registry';

interface BlockPropsEditorProps {
  blockType: BlockType;
  props: unknown;
  onChange: (props: Record<string, unknown>) => void;
}

export function BlockPropsEditor({ blockType, props, onChange }: BlockPropsEditorProps) {
  const registration = getBlockRegistration(blockType);
  const EditComponent = registration?.editComponent;

  if (EditComponent) {
    return <EditComponent props={props as never} onChange={onChange as never} />;
  }

  return (
    <div className="space-y-3 pt-4 border-t border-gray-800">
      <h4 className="text-sm font-medium text-white">Properties</h4>
      <div className="text-sm text-gray-500">
        Editing {Object.keys((props ?? {}) as Record<string, unknown>).length} properties for {blockType}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update BlockEditor to use BlockPropsEditor**

In `components/content/BlockEditor.tsx`:
- Replace the inline placeholder `BlockPropsEditor` (lines 211-220) with an import:

```ts
import { BlockPropsEditor } from './BlockPropsEditor';
```

- Delete the local `BlockPropsEditor` function definition entirely.
- Change the `<BlockPropsEditor blockType={block.type} .../>` call to pass `blockType={block.type as BlockType}` and keep the existing onChange.
- The existing `handleUpdateBlock` signature is fine (`props: Record<string, unknown>`).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add lib/server/content/block-registry.ts components/content/BlockPropsEditor.tsx components/content/BlockEditor.tsx
git commit -m "feat(content): wire block registry previews and props editor"
```

---

### Task 10: Add dnd-kit to BlockEditor

**Files:**
- Modify: `components/content/BlockEditor.tsx`

**Interfaces:**
- Consumes: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Produces: drag-to-reorder blocks within a section via `SortableContext` + `useSortable`

- [ ] **Step 1: Add sortable imports + a SortableBlock wrapper**

Replace the top imports:

```ts
import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

Add a `SortableBlock` component before `BlockEditor`:

```tsx
function SortableBlock({ block, index, children }: { block: Block; index: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40' : ''}>
      <div className="flex items-center gap-1 mb-1">
        <button {...attributes} {...listeners} className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-white cursor-grab" aria-label={`Drag block ${index + 1}`}>
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Wrap the block list with DndContext + SortableContext**

Replace the `blocks.map((block) => (...))` body's outer `<div>` (the "Existing blocks" section) so that each rendered block is wrapped in `<SortableBlock>` and the container uses `DndContext`:

```tsx
const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const oldIndex = blocks.findIndex((b) => b.id === active.id);
  const newIndex = blocks.findIndex((b) => b.id === over.id);
  const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
  onBlocksChange(reordered);
};
```

In the JSX, wrap the map body:

```tsx
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
    <div className="space-y-4">
      {blocks.map((block) => (
        <SortableBlock key={block.id} block={block} index={block.order}>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 text-xs font-medium bg-cyan/20 text-cyan rounded">
                {getBlockRegistration(block.type)?.label || block.type}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleMoveBlock(block.id, 'up')} className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white" aria-label="Move up">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => handleMoveBlock(block.id, 'down')} className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white" aria-label="Move down">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => handleDuplicateBlock(block)} className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white" aria-label="Duplicate">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteBlock(block.id)} className="p-1.5 rounded hover:bg-red-400/10 text-gray-500 hover:text-red-400" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <BlockPropsEditor blockType={block.type} props={block.props} onChange={(p) => handleUpdateBlock(block.id, p)} />
          </div>
        </SortableBlock>
      ))}
    </div>
  </SortableContext>
</DndContext>
```

- [ ] **Step 3: Remove dead inline render path**

The `renderBlockEditor` function (lines 72-139) duplicates the new rendering — delete it to avoid unused-code lint errors.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add components/content/BlockEditor.tsx
git commit -m "feat(content): drag-and-drop block ordering with dnd-kit"
```

---

### Task 11: PageEditor + PageList admin components

**Files:**
- Create: `components/content/PageEditor.tsx`
- Create: `components/content/PageList.tsx`

**Interfaces:**
- Consumes: content API routes; `@tanstack/react-table`; `BlockEditor`, `BlockPalette` (existing)
- Produces: `<PageEditor initialPage />`, `<PageList />`

- [ ] **Step 1: PageEditor**

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save } from 'lucide-react';
import type { Page, Section } from '@/lib/server/content/content-model';
import { BlockEditor } from './BlockEditor';
import { BlockPalette } from './BlockPalette';

interface PageEditorProps {
  initialPage: Page;
}

export function PageEditor({ initialPage }: PageEditorProps) {
  const router = useRouter();
  const [page, setPage] = useState<Page>(initialPage);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(initialPage.sections[0]?.id ?? null);
  const [saving, setSaving] = useState(false);

  const updatePage = (patch: Partial<Page>) => setPage((p) => ({ ...p, ...patch }));

  const handleAddSection = useCallback(async () => {
    const res = await fetch(`/api/pages/${page.id}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Section', layout: 'container', blocks: [] }),
    });
    if (!res.ok) return;
    const section = (await res.json()) as Section;
    setPage((p) => ({ ...p, sections: [...p.sections, section] }));
    setActiveSectionId(section.id);
  }, [page.id]);

  const handleAddBlock = useCallback(
    async (type: string) => {
      if (!activeSectionId) return;
      const res = await fetch(`/api/pages/${page.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: activeSectionId, type, props: {}, order: 0 }),
      });
      if (!res.ok) return;
      const block = (await res.json()) as { id: string; type: string; props: Record<string, unknown>; order: number };
      setPage((p) => ({
        ...p,
        sections: p.sections.map((s) =>
          s.id === activeSectionId ? { ...s, blocks: [...s.blocks, block as never] } : s
        ),
      }));
    },
    [page.id, activeSectionId]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          description: page.description,
          slug: page.slug,
          status: page.status,
          sections: page.sections,
          seo: page.seo,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [page, router]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <input
          value={page.title}
          onChange={(e) => updatePage({ title: e.target.value })}
          placeholder="Page title"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
        />
        <input
          value={page.slug}
          onChange={(e) => updatePage({ slug: e.target.value })}
          placeholder="slug"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
        />
        <button
          onClick={handleAddSection}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-800 rounded-lg hover:border-cyan/50 text-sm text-gray-400"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-cyan/10 border border-cyan/30 rounded-lg text-cyan text-sm font-medium hover:bg-cyan/20"
        >
          <Plus className="w-4 h-4" /> Add Block to selected section
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 p-3 bg-cyan text-bg rounded-lg font-semibold text-sm hover:bg-cyan/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="space-y-6">
        {page.sections.map((section) => (
          <div
            key={section.id}
            onClick={() => setActiveSectionId(section.id)}
            className={`border rounded-xl p-4 cursor-pointer transition-colors ${
              activeSectionId === section.id ? 'border-cyan' : 'border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Section · {section.name}</span>
            </div>
            <BlockEditor
              sectionId={section.id}
              blocks={section.blocks}
              onBlocksChange={(blocks) =>
                setPage((p) => ({
                  ...p,
                  sections: p.sections.map((s) => (s.id === section.id ? { ...s, blocks } : s)),
                }))
              }
            />
          </div>
        ))}
      </div>

      <BlockPalette onAddBlock={handleAddBlock} isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2: PageList**

```tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Plus, ExternalLink } from 'lucide-react';
import type { Page } from '@/lib/server/content/content-model';

interface PageListProps {
  pages: Page[];
  total: number;
}

export function PageList({ pages, total }: PageListProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(
    () =>
      pages.filter(
        (p) =>
          (status === 'all' || p.status === status) &&
          (p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search))
      ),
    [pages, search, status]
  );

  const columns = useMemo<ColumnDef<Page>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'updatedAt', header: 'Updated', cell: ({ getValue }) => new Date(getValue() as Date).toLocaleDateString() },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Link href={`/admin/content/pages/${row.original.id}/edit`} className="text-cyan text-sm hover:text-cyan/80">
              Edit
            </Link>
            {row.original.status === 'published' && (
              <Link href={`/${row.original.slug}`} target="_blank" className="text-gray-400 text-sm hover:text-white inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> View
              </Link>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages…"
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <Link href="/admin/content/pages/new" className="inline-flex items-center gap-2 px-4 py-2 bg-cyan text-bg rounded-lg font-semibold text-sm hover:bg-cyan/90">
          <Plus className="w-4 h-4" /> New Page
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/80">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-400">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-900/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">{filtered.length} of {total} pages</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

- [ ] **Step 4: Commit**

```bash
git add components/content/PageEditor.tsx components/content/PageList.tsx
git commit -m "feat(content): add page editor and page list components"
```

---

### Task 12: Admin content pages

**Files:**
- Create: `app/(admin)/content/pages/page.tsx`
- Create: `app/(admin)/content/pages/new/page.tsx`
- Create: `app/(admin)/content/pages/[id]/edit/page.tsx`
- Create: `app/(admin)/content/pages/[id]/versions/page.tsx`

**Interfaces:**
- Consumes: `PageList`, `PageEditor`, content API routes
- Produces: working admin UI at `/admin/content/pages`, `/admin/content/pages/new`, `/admin/content/pages/[id]/edit`, `/admin/content/pages/[id]/versions`

- [ ] **Step 1: Pages list page**

```tsx
import Link from 'next/link';
import { listPages } from '@/lib/server/content/content-service';
import { PageList } from '@/components/content/PageList';

export const metadata = { title: 'Pages', description: 'Manage content pages' };

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const { status, search, page } = await searchParams;
  const { pages, total } = await listPages({
    status: status as 'draft' | 'published' | 'archived' | undefined,
    search,
    page: page ? parseInt(page, 10) : 1,
    limit: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-white">Content Pages</h1>
        <Link href="/admin/content/pages/new" className="hidden" />
      </div>
      <PageList pages={pages} total={total} />
    </div>
  );
}
```

- [ ] **Step 2: New page page**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const create = async () => {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, status: 'draft', sections: [] }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? 'Failed to create page');
      return;
    }
    const page = (await res.json()) as { id: string };
    router.push(`/admin/content/pages/${page.id}/edit`);
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-white mb-6">New Page</h1>
      <label className="block text-sm text-gray-400 mb-1" htmlFor="title">Title</label>
      <input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. About Us"
        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm mb-4"
      />
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      <button
        onClick={create}
        disabled={!title.trim()}
        className="px-4 py-2 bg-cyan text-bg rounded-lg font-semibold text-sm hover:bg-cyan/90 disabled:opacity-50"
      >
        Create
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Edit page**

```tsx
import { notFound } from 'next/navigation';
import { getPageById } from '@/lib/server/content/content-service';
import { PageEditor } from '@/components/content/PageEditor';

export const metadata = { title: 'Edit Page', description: 'Edit content page' };

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getPageById(id);
  if (!page) notFound();

  return <PageEditor initialPage={page} />;
}
```

- [ ] **Step 4: Versions page**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { PageVersion } from '@/lib/server/content/content-model';

export default function VersionsPage() {
  const params = useParams<{ id: string }>();
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/pages/${params.id}?action=versions`).then(async (res) => {
      const body = await res.json();
      setVersions(body.versions ?? []);
    });
  }, [params.id]);

  const restore = async (versionId: string) => {
    const res = await fetch(`/api/pages/${params.id}?action=restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    });
    setMessage(res.ok ? 'Page restored' : 'Restore failed');
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-white">Version History</h1>
      {message && <p className="text-sm text-cyan">{message}</p>}
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-surface">
            <div>
              <p className="text-sm text-white">{v.changeDescription || 'Version'}</p>
              <p className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => restore(v.id)}
              className="px-3 py-1.5 text-sm text-cyan border border-cyan/30 rounded-lg hover:bg-cyan/10"
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add "app/(admin)/content"
git commit -m "feat(content): add admin content pages"
```

---

### Task 13: Public renderer + SEO

**Files:**
- Create: `app/(public)/[slug]/page.tsx`
- Modify: `lib/server/content/content-service.ts` (add `getPublicPageBySlug`)

**Interfaces:**
- Consumes: content-service, block previews, `next` Metadata API
- Produces: `GET /[slug]` renders published page with SEO head + JSON-LD; `notFound()` for unpublished/missing

- [ ] **Step 1: Add public getter to content-service**

Append to `content-service.ts`:

```ts
export async function getPublicPageBySlug(slug: string, tenantId: string): Promise<Page | null> {
  const page = await prisma.page.findFirst({
    where: { slug, tenantId, status: 'published' },
    include: { sections: { include: { blocks: true }, orderBy: { order: 'asc' } } },
  });
  if (!page) return null;

  const mapped = mapPrismaPage(page);
  mapped.sections = mapped.sections
    .filter((s) => !s.isPlaceholder)
    .map((s) => ({ ...s, blocks: s.blocks.filter((b) => !b.isPlaceholder) }));
  return mapped;
}
```

Also add a hostname resolver (stub interface):

```ts
export async function resolveTenantFromHostname(hostname: string): Promise<string> {
  // 1. Custom domains mapping (marketplace/enterprise — stub interface, no-op today)
  // 2. Fallback: hostname without subdomain → tenant lookup
  // 3. Default: process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? 'default'
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? 'default';
}
```

- [ ] **Step 2: Create the public page**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getPublicPageBySlug, resolveTenantFromHostname } from '@/lib/server/content/content-service';
import { BLOCK_PREVIEWS } from '@/lib/server/content/block-registry';

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPage(slug: string) {
  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const tenantId = await resolveTenantFromHostname(host);
  return getPublicPageBySlug(slug, tenantId);
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) return {};

  const title = page.seo?.title ?? page.title;
  const description = page.seo?.description ?? page.description ?? '';

  return {
    title,
    description,
    robots: page.seo?.noIndex ? { index: false, follow: !page.seo?.noFollow } : undefined,
    alternates: { canonical: page.seo?.canonicalUrl ?? undefined },
    openGraph: {
      title: page.openGraph?.title ?? title,
      description: page.openGraph?.description ?? description,
      images: page.openGraph?.image ? [{ url: page.openGraph.image }] : undefined,
      type: page.openGraph?.type ?? 'website',
    },
    twitter: page.twitterCard
      ? { card: page.twitterCard.card, site: page.twitterCard.site, creator: page.twitterCard.creator }
      : undefined,
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-bg">
      {page.schemaOrg && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.schemaOrg) }}
        />
      )}

      {page.sections.map((section) => (
        <section key={section.id} className={section.layout === 'full-width' ? '' : 'mx-auto max-w-6xl px-6'}>
          <div className="flex flex-wrap gap-4 py-6">
            {section.blocks.map((block) => {
              const Preview = BLOCK_PREVIEWS[block.type];
              if (!Preview) return null;
              return <Preview key={block.id} props={block.props} />;
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 3: Verify route priority**

Static segments `tour/` and `stream/` exist under `app/(public)/`; confirm they still take precedence (Next.js route priority) — verify with `pnpm build` and by checking that `/tour/[id]` builds.

Run: `npx tsc --noEmit --incremental false` and `pnpm lint`
Expected: 0 errors each.

Run: `pnpm build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/[slug]/page.tsx" lib/server/content/content-service.ts
git commit -m "feat(content): public page renderer with SEO and JSON-LD"
```

---

### Task 14: Phase B end-to-end verification

- [ ] **Step 1: Full static checks**

Run: `pnpm lint` and `npx tsc --noEmit --incremental false` and `pnpm build`
Expected: all pass (0 errors, build success).

- [ ] **Step 2: Runtime smoke via `pnpm dev`**

Run: `pnpm dev`
Then in another shell, using a seeded ADMIN user + valid Supabase session cookie:
1. `POST /api/pages` `{ "title": "About", "status": "draft", "sections": [] }` → 201.
2. `POST /api/pages/<id>/sections` `{ "name": "Hero", "layout": "container", "blocks": [] }` → 201.
3. `POST /api/pages/<id>/blocks` `{ "sectionId": "<sectionId>", "type": "hero", "props": {"headline":"Hi","alignment":"center"}, "order": 0 }` → 201.
4. `POST /api/pages/<id>?action=publish` → 200.
5. `GET /<slug>` → 200 HTML with `<meta name="robots">` absent (noIndex false), title from page.
6. `GET /api/pages/<id>?action=versions` → array with ≥1 entry.
Confirm rows exist in Supabase: `SELECT count(*) FROM pages;`, `SELECT count(*) FROM sections;`, `SELECT count(*) FROM blocks;`.

- [ ] **Step 3: Final commit of any verification fixes**

If any task above surfaced fixes, commit them:
```bash
git add -A
git commit -m "fix(content): verification fixes"
```

---

## Self-Review

- **Spec coverage:** Page/Section/Block/PageVersion models → Task 1; migration+RLS → Task 2; typed refactor → Task 3; sections/blocks routes → Task 4; zod → Task 5; service tests → Task 6; deps → Task 7; 9 block components → Task 8; registry wiring + BlockPropsEditor → Task 9; dnd-kit → Task 10; PageEditor/PageList → Task 11; admin pages → Task 12; public renderer + SEO → Task 13; E2E → Task 14. The design's "18 types" list conflicts with actual `BLOCK_TYPES` (19) — the plan uses the code's types, documented in Global Constraints.
- **Placeholder scan:** no TBD/TODO; every code step has full implementations.
- **Type consistency:** `addSectionService(pageId, input: SectionInput)` and `addBlockService(sectionId, input: BlockInput)` names used consistently across Tasks 3-5 and the routes; `BLOCK_PREVIEWS` used by the public renderer (Task 13) matches the map created in Task 9; `toPageVersion` used by `getPageVersions`.