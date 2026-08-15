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

ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "pages" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "sections" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sections" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "blocks" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "page_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "page_versions"
  USING ("page_id" IN (SELECT id FROM "pages" WHERE "tenant_id" = current_setting('app.current_tenant')::TEXT));
