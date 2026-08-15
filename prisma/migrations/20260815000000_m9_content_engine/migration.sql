-- Migration: M9 Content Engine (Task 2)
-- Creates the four content tables (pages, sections, blocks, page_versions)
-- in dependency order, then enables row-level security with tenant isolation.
-- NOTE: page_versions has NO tenant_id column by design (spec §5.1); its RLS
-- policy scopes rows through their parent pages row via a subquery.

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "seo" JSONB,
    "openGraph" JSONB,
    "twitterCard" JSONB,
    "schemaOrg" JSONB,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "placeholder_key" TEXT,
    "published_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "background" JSONB,
    "padding" JSONB,
    "container" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "placeholder_key" TEXT,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "props" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "placeholder_key" TEXT,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_versions" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pages_tenant_id_idx" ON "pages"("tenant_id");
CREATE INDEX "pages_status_idx" ON "pages"("status");
CREATE UNIQUE INDEX "pages_slug_tenant_id_key" ON "pages"("slug", "tenant_id");
CREATE INDEX "sections_page_id_idx" ON "sections"("page_id");
CREATE INDEX "sections_tenant_id_idx" ON "sections"("tenant_id");
CREATE INDEX "blocks_section_id_idx" ON "blocks"("section_id");
CREATE INDEX "blocks_tenant_id_idx" ON "blocks"("tenant_id");
CREATE INDEX "page_versions_page_id_idx" ON "page_versions"("page_id");

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "pages" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "sections" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sections" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "blocks" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "page_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "page_versions"
  USING ("page_id" IN (SELECT id FROM "pages" WHERE "tenant_id" = current_setting('app.current_tenant')::TEXT));
