# M9: Content Engine — Design Spec

**Date:** 2026-08-15
**Status:** Approved (with adjustments)
**Owner:** VizAgent

## 1. Overview

M9 delivers a non-coding website builder: a Page → Section → Block content model with a
draft/publish/archive workflow, version history and rollback, SEO (OpenGraph / Twitter /
Schema.org), a visual block editor, admin UI, and public page rendering with tenant isolation.

A large part of the M9 domain layer already exists in the repo and is **lint/tsc/build clean**:

- `lib/server/content/content-model.ts` — 18 block types, `Page`/`Section`/`Block`/`PageVersion`
  domain interfaces (incl. `seo`, `openGraph`, `twitterCard`, `schemaOrg`, `isPlaceholder`,
  `placeholderKey`, `version`), `PAGE_STATUS`, labels, layouts, container sizes, factories.
- `lib/server/content/block-registry.ts` — block metadata registry, categories,
  `canNest`, `validateBlockProps`, optional `previewComponent`/`editComponent` slots.
- `lib/server/content/content-service.ts` — full CRUD, publish/unpublish, versions/restore,
  duplicate, reorder, RBAC (`content.write`), audit logging, tenant scoping.
- `app/api/pages/**` — 4 route files (list/create, get/update/delete + publish/unpublish/
  duplicate/restore/versions, sections reorder, blocks reorder).
- `components/content/BlockEditor.tsx`, `BlockPalette.tsx`, `app/(admin)/layout.tsx`.

**Critical gap:** the Prisma schema has **no** `Page`/`Section`/`Block`/`PageVersion` models.
`content-service.ts` runs on `const db = prisma as any` (line 21), so every content API call
crashes at runtime (PrismaClient exposes no `page` delegate). The core of M9 is making the
existing layer persistent and type-safe, then building the UI.

## 2. Goals

- Persistent, type-safe content data layer (no `as any`).
- Draft → publish → archive workflow, version history, rollback.
- Visual block editor with drag-and-drop and per-block props editing.
- Admin pages list/edit/new with search + status filters.
- Public renderer for published pages with full SEO head + Schema.org JSON-LD.
- All 18 block types, each with a typed preview renderer and props editor.
- RBAC `content.write`, tenant isolation, audit logging.

## 3. Non-Goals

- Fixing pre-existing DB drift unrelated to content (see §7 note — flagged only).
- Marketplace/enterprise custom-domain tenant resolution (stubbed interface only).
- Scheduled publication (future work; `publishedAt` is stored but no scheduler).
- Block type schema plug-ins / external contributions.

## 4. Decisions (from brainstorming)

1. **Persistence:** add real Prisma models + refactor service to typed client (remove `as any`).
2. **Dependencies:** full spec install — `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`,
   `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`,
   `@tanstack/react-table`, `date-fns`. (`zod` already installed; `@prisma/adapter-pg` stays
   installed but **unused** — client is Prisma 5.22, adapter is v7 and was deliberately dropped.)
3. **Migration:** generate DDL from schema, write a local migration file under
   `prisma/migrations/`, apply to Supabase now via the connected MCP project.
4. **Phasing:** two phases — data layer first, then UI.
5. **BlockComponents:** all 18 components.

## 5. Phase A — Data Layer

### 5.1 Prisma models

Added to `prisma/schema.prisma` using house conventions (snake_case `@map`, `@@map`, UUID ids,
`tenantId String @map("tenant_id")` + index, compound slug uniqueness):

```prisma
model Page {
  id            String    @id @default(uuid())
  slug          String
  title         String
  description   String?
  status        String    @default("draft")
  seo           Json?
  openGraph     Json?
  twitterCard   Json?
  schemaOrg     Json?
  isPlaceholder Boolean   @default(false) @map("is_placeholder")
  placeholderKey String?  @map("placeholder_key")
  publishedAt   DateTime? @map("published_at")
  createdBy     String    @map("created_by")
  updatedBy     String    @map("updated_by")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  version       Int       @default(1)
  tenantId      String    @map("tenant_id")

  sections Section[]
  versions PageVersion[]

  @@unique([slug, tenantId])
  @@index([tenantId])
  @@index([status])
  @@map("pages")
}

model Section {
  id            String   @id @default(uuid())
  pageId        String   @map("page_id")
  name          String
  layout        String
  background    Json?
  padding       Json?
  container     String?
  order         Int      @default(0)
  isPlaceholder Boolean  @default(false) @map("is_placeholder")
  placeholderKey String? @map("placeholder_key")
  tenantId      String   @map("tenant_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  page   Page    @relation(fields: [pageId], references: [id], onDelete: Cascade)
  blocks Block[]

  @@index([pageId])
  @@index([tenantId])
  @@map("sections")
}

model Block {
  id            String   @id @default(uuid())
  sectionId     String   @map("section_id")
  type          String
  props         Json?
  order         Int      @default(0)
  isPlaceholder Boolean  @default(false) @map("is_placeholder")
  placeholderKey String? @map("placeholder_key")
  tenantId      String   @map("tenant_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

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

> **Model-shape note (self-review):** the `PageVersion` shape above is derived from the actual
> service code (`content-service.ts:299-316`, domain interface at `content-model.ts:266-273`),
> which writes `snapshot` (Json) and `changeDescription`, not `data`/`note`. There is **no**
> `version` number column on `PageVersion` and no `@@unique([pageId, version])` — version
> numbering lives on `Page.version` (incremented on update/publish/restore). Page-level tenant
> gating in `getPageVersions` makes a `tenantId` column unnecessary.

Notes:
- `seo`/`openGraph`/`twitterCard`/`schemaOrg`/`background`/`padding`/`props` are `Json` columns
  serialized from the domain types; the service mappers decode them (see §5.3).
- `@@unique([slug, tenantId])` yields the `slug_tenantId` compound key the service already uses.

### 5.2 Migration + RLS

- Migration name: `m9_content_engine`.
- Generated via `prisma migrate diff` from the updated schema (no DB connection needed to
  author the SQL), written as `prisma/migrations/<timestamp>_m9_content_engine/migration.sql`.
- Same SQL applied to the Supabase project **now** via the Supabase MCP `apply_migration`
  tool so the runtime tables exist.
- RLS per house pattern (`prisma/migrations/20260807041024_enable_rls/migration.sql`):
  `ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;` + `CREATE POLICY "tenant_isolation" ON
  "pages" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);` — repeated for
  `sections`, `blocks`, `page_versions`. **Note:** the existing pattern casts `::TEXT` (the
  `tenant_id` columns are `String`), so we follow that rather than `::uuid`.

### 5.3 Typed service refactor

In `lib/server/content/content-service.ts`:
- Remove `const db = prisma as any` (line 21); use the typed `prisma` client directly.
- Re-type the existing `mapPrismaPage` (currently `content-service.ts:512`, typed `(page: Page) => Page`)
  to accept the Prisma include-result type (`Prisma.PageGetPayload<{ include: { sections: { include: { blocks: true } } } }>`)
  and decode the Json columns (`seo`, `openGraph`, `twitterCard`, `schemaOrg`, section
  `background`/`padding`, block `props`) into the domain types via `as unknown as` at the
  mapping boundary — never blindly at call sites. Domain types remain the single source of truth.
- Add `toPageVersion` for the raw `pageVersion` rows (cast `snapshot` Json → `Page`); used by
  `getPageVersions`/`createPageVersion` which today return raw rows typed as domain `PageVersion`.
- Watch typed-client friction points: `seo: { ...existing.seo, ...input.seo }` (Json spread),
  `where: Record<string, unknown>` in `listPages` (`.OR` with `mode: 'insensitive'`), and
  Json-column writes of object props (strip `undefined` or cast to `InputJsonValue`).

### 5.4 Zod validation

- New `lib/server/content/content-schemas.ts`: `createPageSchema`, `updatePageSchema`,
  `sectionSchema`, `blockSchema` (zod is installed; Prisma `Json` fields accept arbitrary
  values, so runtime validation is on us).
- Wire into existing API routes (route shapes unchanged) — parse `await request.json()`,
  return `400 { error }` on invalid input.

### 5.5 Phase A verification

1. `npx prisma generate` (client regenerated with content delegates).
2. `npx tsc --noEmit --incremental false` — 0 errors.
3. `pnpm lint` — 0 errors.
4. `pnpm build` — success.
5. Runtime smoke via `pnpm dev`: create page → add section/block → publish → GET via
   `/api/pages` + `/api/pages/[id]`; confirm rows in Supabase.

## 6. Phase B — UI Layer

### 6.1 Dependencies

`pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @radix-ui/react-select
@radix-ui/react-tabs @radix-ui/react-tooltip @tanstack/react-table date-fns`

### 6.2 BlockComponents (18)

`components/content/blocks/<type>.tsx` — each exports a typed `Preview`
(`React.ComponentType<{ props: BlockProps[Type] }>`) and a `PropsEditor`
(`React.ComponentType<{ props; onChange }>`). Wire them into `block-registry.ts`'s
`previewComponent`/`editComponent` slots. Types:

1. hero, 2. features, 3. rich-text, 4. image-gallery, 5. cta, 6. faq, 7. stats,
8. section-header, 9. quote, 10. callout, 11. pricing, 12. logo-cloud, 13. team,
14. testimonial, 15. blog-grid, 16. portfolio-grid, 17. video, 18. contact-form.

### 6.3 Editor components

- `BlockEditor.tsx` (exists) — add dnd-kit `SortableContext` for sections + blocks.
- `BlockPalette.tsx` (exists) — reuse; group by `BLOCK_CATEGORIES`.
- New `BlockPropsEditor.tsx` — renders the active block's `PropsEditor`.
- New `PageEditor.tsx` — orchestrates palette + section/block canvas + props panel.
- New `PageList.tsx` — `@tanstack/react-table` list with search, status filter,
  create/publish/duplicate/archive actions.

### 6.4 Admin pages

`app/(admin)/content/`:
- `pages/page.tsx` — PageList.
- `pages/new/page.tsx` — create page.
- `pages/[id]/edit/page.tsx` — PageEditor.
- `pages/[id]/versions/page.tsx` — version history / restore.
- Reuses `app/(admin)/layout.tsx`.

### 6.5 Public renderer + SEO

- `app/(public)/[slug]/page.tsx` — async server component:
  - `generateMetadata`: title/description from page SEO, OpenGraph, Twitter, `robots`
    (noindex/nofollow), canonical, alternates.
  - Renders `<script type="application/ld+json">` Schema.org JSON-LD.
  - Renders published page's sections/blocks via the block components.
  - `notFound()` for missing or non-published pages.
- Static segments `tour/` and `stream/` take precedence over `[slug]` (Next.js route
  priority), so no conflict.

### 6.6 Public tenant resolution

New non-auth helper in `content-service.ts`:

```ts
async function resolveTenantFromHostname(hostname: string): Promise<string> {
  // 1. Custom domains mapping (marketplace/enterprise — stub interface, no-op today)
  // 2. Fallback: hostname without subdomain → tenant lookup
  // 3. Default: process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? 'default'
}
```

`getPublicPageBySlug(slug, hostname)` queries `status: 'published'` scoped to the resolved
tenant and returns the public `Page` (or null). Placeholder blocks are filtered from public
output.

## 7. Pre-existing DB drift (flagged, not M9-scoped)

- Live DB has applied only 3 of 4 local migrations (`_prisma_migrations` rows=3; the
  `add_subscription` migration is not applied). Missing tables: `subscriptions`, `approvals`,
  `audit_logs`.
- `deployments` table is missing `mode` and `approval_id` columns that the schema declares
  (the earlier `approvalId @unique` fix was schema-only). Deployment creation writes `mode`,
  so this will fail at runtime today.
- `auditLog()` swallows write failures (audit-logger.ts:40-42), so missing `audit_logs` does
  **not** block M9 requests.
- None of this blocks M9. Recommend a separate schema-sync migration (`m9_deployment_sync`)
  to add `mode`/`approval_id` to `deployments` and apply the pending subscription migration.

## 8. Verification (Phase B)

- `pnpm lint` / `npx tsc --noEmit` / `pnpm build` all clean.
- `pnpm dev` end-to-end: create page in admin → drag/drop sections/blocks → edit props →
  publish → view live at `/[slug]` → check SEO head + JSON-LD → 404 for unpublished.