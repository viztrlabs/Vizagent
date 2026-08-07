-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "xr_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "configurator_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "viewers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "qa_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deployments" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: tenant isolation
CREATE POLICY "tenant_isolation" ON "users"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "tenant_isolation" ON "projects"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "tenant_isolation" ON "assets"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "tenant_isolation" ON "xr_assets"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "tenant_isolation" ON "configurations"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "tenant_isolation" ON "configurator_sessions"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "tenant_isolation" ON "viewers"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "tenant_isolation" ON "qa_reports"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);

CREATE POLICY "tenant_isolation" ON "deployments"
  USING ("tenant_id" = current_setting('app.current_tenant')::TEXT);
