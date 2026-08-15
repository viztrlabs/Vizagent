-- M11 Client Portal Migration
-- Tables: annotations, comments, approval_workflows, deliverables, project_versions

-- CreateTable: annotations
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "position" JSONB NOT NULL,
    "content" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: comments
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "mentions" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: approval_workflows
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable: deliverables
CREATE TABLE "deliverables" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable: project_versions
CREATE TABLE "project_versions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "project_versions_pkey" PRIMARY KEY ("id")
);

-- Indexes for annotations
CREATE INDEX "annotations_project_id_idx" ON "annotations"("project_id");
CREATE INDEX "annotations_author_id_idx" ON "annotations"("author_id");
CREATE INDEX "annotations_tenant_id_idx" ON "annotations"("tenant_id");

-- Indexes for comments
CREATE INDEX "comments_project_id_idx" ON "comments"("project_id");
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");
CREATE INDEX "comments_tenant_id_idx" ON "comments"("tenant_id");

-- Indexes for approval_workflows
CREATE INDEX "approval_workflows_project_id_idx" ON "approval_workflows"("project_id");
CREATE INDEX "approval_workflows_requester_id_idx" ON "approval_workflows"("requester_id");
CREATE INDEX "approval_workflows_approver_id_idx" ON "approval_workflows"("approver_id");
CREATE INDEX "approval_workflows_tenant_id_idx" ON "approval_workflows"("tenant_id");

-- Indexes for deliverables
CREATE INDEX "deliverables_project_id_idx" ON "deliverables"("project_id");
CREATE INDEX "deliverables_tenant_id_idx" ON "deliverables"("tenant_id");

-- Indexes for project_versions
CREATE INDEX "project_versions_project_id_idx" ON "project_versions"("project_id");
CREATE INDEX "project_versions_tenant_id_idx" ON "project_versions"("tenant_id");

-- RLS Policies
ALTER TABLE "annotations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "annotations" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "comments" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "approval_workflows" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "approval_workflows" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "deliverables" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "deliverables" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

ALTER TABLE "project_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "project_versions" USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);