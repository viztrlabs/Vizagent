import { prisma } from '../../../lib/db/server';
import { getCurrentAuth } from '../../../lib/auth/session';
import { auditLog } from '../audit/audit-logger';

// Helper to convert Date objects in an object to ISO strings for JSON compatibility
function jsonSafe(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = jsonSafe(obj[key]);
      }
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map(jsonSafe);
  }
  return obj; // primitive
}

export interface JobFilter {
  status?: string;
  jobId?: string;
  createdAt?: [Date, Date];
}

export interface JobExecution {
  id: string;
  jobId: string;
  status: string;
  progress: number | null;
  error: string | null;
  attempts: number;
  finishedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export async function listJobs(filter: JobFilter = {}): Promise<JobExecution[]> {
  const { status, jobId, ...filterRest } = filter;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (jobId) {
    where.jobId = jobId;
  }

  if (filterRest.createdAt) {
    where.createdAt = {
      gte: filterRest.createdAt[0],
      lte: filterRest.createdAt[1],
    };
  }

  const jobs = await prisma.jobExecution.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return jobs;
}

export async function createJobExecution(jobId: string): Promise<JobExecution> {
  const { dbUser } = await getCurrentAuth();
  const tenantId = dbUser?.tenantId ?? '';

  const job = await prisma.jobExecution.create({
    data: {
      jobId,
      status: 'pending',
      attempts: 0,
      tenantId,
    },
  });

  // Audit log
    await auditLog({
      action: 'job_execution.create',
      resource: 'JobExecution',
      resourceId: job.id,
      changes: jsonSafe({ jobId, status: 'pending' }),
    });

  return job;
}

export async function updateJobExecution(
  jobId: string,
  updates: Partial<{
    status: string;
    progress: number | null;
    error: string | null;
    attempts: number;
    finishedAt: Date | null;
    failedAt: Date | null;
  }>
): Promise<JobExecution> {
  const job = await prisma.jobExecution.update({
    where: { id: jobId },
    data: updates,
  });

  // Audit log
    await auditLog({
      action: 'job_execution.update',
      resource: 'JobExecution',
      resourceId: jobId,
      changes: jsonSafe(updates),
    });

  return job;
}

export async function failJobExecution(
  jobId: string,
  error: string | null
): Promise<JobExecution> {
  const job = await prisma.jobExecution.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      error,
      failedAt: new Date(),
    },
  });

  // Audit log
  await auditLog({
    action: 'job_execution.fail',
    resource: 'JobExecution',
    resourceId: jobId,
    changes: { status: 'failed', error },
  });

  return job;
}

export async function completeJobExecution(
  jobId: string,
  progress: number | null
): Promise<JobExecution> {
  const job = await prisma.jobExecution.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      progress,
      finishedAt: new Date(),
    },
  });

  // Audit log
  await auditLog({
    action: 'job_execution.complete',
    resource: 'JobExecution',
    resourceId: jobId,
    changes: { status: 'completed', progress },
  });

  return job;
}

export async function getJobById(jobId: string): Promise<JobExecution | null> {
  const job = await prisma.jobExecution.findUnique({
    where: { id: jobId },
  });

  return job || null;
}