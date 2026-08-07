-- Add tenant_id columns with defaults first
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "xr_assets" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "configurations" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "configurator_sessions" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "viewers" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "qa_reports" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "deployments" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX IF NOT EXISTS "projects_tenant_id_idx" ON "projects"("tenant_id");
CREATE INDEX IF NOT EXISTS "assets_tenant_id_idx" ON "assets"("tenant_id");
CREATE INDEX IF NOT EXISTS "xr_assets_tenant_id_idx" ON "xr_assets"("tenant_id");
CREATE INDEX IF NOT EXISTS "configurations_tenant_id_idx" ON "configurations"("tenant_id");
CREATE INDEX IF NOT EXISTS "configurator_sessions_tenant_id_idx" ON "configurator_sessions"("tenant_id");
CREATE INDEX IF NOT EXISTS "viewers_tenant_id_idx" ON "viewers"("tenant_id");
CREATE INDEX IF NOT EXISTS "qa_reports_tenant_id_idx" ON "qa_reports"("tenant_id");
CREATE INDEX IF NOT EXISTS "deployments_tenant_id_idx" ON "deployments"("tenant_id");

-- Drop defaults after backfill (optional, keeps DB clean)
ALTER TABLE "users" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "assets" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "xr_assets" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "configurations" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "configurator_sessions" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "viewers" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "qa_reports" ALTER COLUMN "tenant_id" DROP DEFAULT;
ALTER TABLE "deployments" ALTER COLUMN "tenant_id" DROP DEFAULT;
