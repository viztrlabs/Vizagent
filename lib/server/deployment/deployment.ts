import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';

export interface DeploymentConfig {
  projectId: string;
  mode: 'tour' | 'webxr' | 'webar' | 'vr' | 'stream';
  environment: 'preview' | 'production';
}

export interface DeploymentResult {
  deploymentId: string;
  status: 'pending' | 'building' | 'ready' | 'failed';
  url?: string;
  logs?: string;
}

/**
 * M8: Create a preview deployment
 */
export async function createPreviewDeployment(config: DeploymentConfig): Promise<DeploymentResult> {
  const { dbUser, role, tenantId } = await getCurrentAuth();

  // M8: require deployments.write permission
  const hasPermission = await requirePermission('deployments.write');
  if (!hasPermission) {
    throw new Error('Forbidden: deployments.write required');
  }

  // Verify project exists and belongs to tenant
  const project = await prisma.project.findFirst({
    where: { id: config.projectId, tenantId },
    select: { id: true, name: true },
  });
  if (!project) {
    throw new Error('Project not found');
  }

  // Create deployment record
  const deployment = await prisma.deployment.create({
    data: {
      projectId: config.projectId,
      mode: config.mode,
      environment: 'preview',
      status: 'building',
      tenantId,
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    },
  });

  // TODO: Trigger actual build process (Vercel deploy hook, etc.)
  // For now, mark as ready with preview URL
  const previewUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/${config.mode}/${config.projectId}?preview=true&deployment=${deployment.id}`;

  await prisma.deployment.update({
    where: { id: deployment.id },
    data: {
      status: 'ready',
      previewUrl,
    },
  });

  await auditLog({
    action: 'deployment.preview.create',
    resource: 'deployment',
    resourceId: deployment.id,
    changes: { mode: config.mode, projectId: config.projectId },
  });

  return { deploymentId: deployment.id, status: 'ready', url: previewUrl };
}

/**
 * M8: Publish to production — requires QA passed + human approval
 */
export async function publishToProduction(config: DeploymentConfig, approvalToken: string): Promise<DeploymentResult> {
  const { dbUser, role, tenantId } = await getCurrentAuth();

  // M8: require deployments.write + admin approval
  const hasPermission = await requirePermission('deployments.write');
  if (!hasPermission) {
    throw new Error('Forbidden: deployments.write required');
  }

  // Verify approval token (stored in approvals table)
  const approval = await prisma.approval.findUnique({
    where: { token: approvalToken },
  });
  if (!approval || approval.status !== 'approved' || approval.resource !== 'deployment' || approval.resourceId !== config.projectId) {
    throw new Error('Invalid or missing approval token');
  }

  // Check QA passed
  const qaReport = await prisma.qaReport.findFirst({
    where: { projectId: config.projectId, qaStatus: 'passed' },
    orderBy: { checkedAt: 'desc' },
  });
  if (!qaReport) {
    throw new Error('QA must pass before production publish');
  }

  // Create production deployment
  const deployment = await prisma.deployment.create({
    data: {
      projectId: config.projectId,
      mode: config.mode,
      environment: 'production',
      status: 'building',
      tenantId,
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
      approvalId: approval.id,
    },
  });

  // TODO: Trigger Vercel production deploy
  const productionUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/${config.mode}/${config.projectId}`;

  await prisma.deployment.update({
    where: { id: deployment.id },
    data: {
      status: 'ready',
      publicUrl: productionUrl,
    },
  });

  // Update project status
  await prisma.project.update({
    where: { id: config.projectId },
    data: { status: 'published', publishedUrl: productionUrl },
  });

  await auditLog({
    action: 'deployment.publish',
    resource: 'deployment',
    resourceId: deployment.id,
    changes: { mode: config.mode, projectId: config.projectId, url: productionUrl },
  });

  return { deploymentId: deployment.id, status: 'ready', url: productionUrl };
}

/**
 * M8: Get deployment status
 */
export async function getDeploymentStatus(deploymentId: string) {
  const { tenantId } = await getCurrentAuth();
  return prisma.deployment.findFirst({
    where: { id: deploymentId, tenantId },
    select: {
      id: true,
      status: true,
      mode: true,
      environment: true,
      previewUrl: true,
      publicUrl: true,
      createdAt: true,
    },
  });
}

/**
 * M8: List deployments for a project
 */
export async function listDeployments(projectId: string) {
  const { tenantId } = await getCurrentAuth();
  return prisma.deployment.findMany({
    where: { projectId, tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      mode: true,
      environment: true,
      previewUrl: true,
      publicUrl: true,
      createdAt: true,
    },
  });
}

/**
 * M8: Rollback to previous deployment
 */
export async function rollbackDeployment(deploymentId: string) {
  const { tenantId } = await getCurrentAuth();

  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId, tenantId },
  });
  if (!deployment) throw new Error('Deployment not found');

  // Mark current production as rolled back
  await prisma.deployment.updateMany({
    where: { projectId: deployment.projectId, environment: 'production', status: 'ready' },
    data: { status: 'rolled_back' },
  });

  // Mark rolled-back deployment as active
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: 'ready', environment: 'production' },
  });

  // Update project published URL
  const rolledBack = await prisma.deployment.findFirst({
    where: { id: deploymentId },
  });
  await prisma.project.update({
    where: { id: deployment.projectId },
    data: { publishedUrl: rolledBack?.publicUrl },
  });

  await auditLog({
    action: 'deployment.rollback',
    resource: 'deployment',
    resourceId: deploymentId,
  });

  return { success: true };
}