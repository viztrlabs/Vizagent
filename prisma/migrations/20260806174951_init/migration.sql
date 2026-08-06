-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'client',
    "avatarUrl" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "client_id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL DEFAULT 'tour',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "settings" JSONB NOT NULL DEFAULT '{"cameraHeight": 1.7, "autoRotate": false, "hotspotStyle": "pin"}',
    "budget" DECIMAL(10,2),
    "deadline" TIMESTAMP(3),
    "published_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" BIGINT,
    "storage_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qa_reports" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "qa_status" TEXT NOT NULL,
    "checks" JSONB NOT NULL DEFAULT '[]',
    "issues" JSONB NOT NULL DEFAULT '[]',
    "checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qa_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "preview_url" TEXT,
    "public_url" TEXT,
    "commit_sha" TEXT,
    "deployed_by" TEXT,
    "deployed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xr_assets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'model3d',
    "service" TEXT NOT NULL DEFAULT 'webXR',
    "glb_url" TEXT,
    "equirect_url" TEXT,
    "usdz_url" TEXT,
    "file_size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xr_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configurations" (
    "id" TEXT NOT NULL,
    "xr_asset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configurator_sessions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "share_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB NOT NULL DEFAULT '{"canEdit": [], "canView": [], "isPublic": false}',
    "start_at" TIMESTAMP(3),
    "reminder_sent_at" TIMESTAMP(3),
    "gcal_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurator_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewers" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "viewers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "projects_client_id_idx" ON "projects"("client_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "assets_project_id_idx" ON "assets"("project_id");

-- CreateIndex
CREATE INDEX "qa_reports_project_id_idx" ON "qa_reports"("project_id");

-- CreateIndex
CREATE INDEX "deployments_project_id_idx" ON "deployments"("project_id");

-- CreateIndex
CREATE INDEX "xr_assets_project_id_idx" ON "xr_assets"("project_id");

-- CreateIndex
CREATE INDEX "configurations_xr_asset_id_idx" ON "configurations"("xr_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "configurations_xr_asset_id_name_key" ON "configurations"("xr_asset_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "configurator_sessions_share_token_key" ON "configurator_sessions"("share_token");

-- CreateIndex
CREATE INDEX "configurator_sessions_share_token_idx" ON "configurator_sessions"("share_token");

-- CreateIndex
CREATE INDEX "configurator_sessions_host_id_idx" ON "configurator_sessions"("host_id");

-- CreateIndex
CREATE INDEX "configurator_sessions_start_at_idx" ON "configurator_sessions"("start_at");

-- CreateIndex
CREATE INDEX "viewers_session_id_idx" ON "viewers"("session_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_reports" ADD CONSTRAINT "qa_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_deployed_by_fkey" FOREIGN KEY ("deployed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xr_assets" ADD CONSTRAINT "xr_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_xr_asset_id_fkey" FOREIGN KEY ("xr_asset_id") REFERENCES "xr_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewers" ADD CONSTRAINT "viewers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "configurator_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
