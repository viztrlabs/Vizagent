import { prisma } from '../../../lib/db/server';
import { getCurrentAuth, NULL_TENANT } from '../../../lib/auth/session';
import { auditLog } from '../audit/audit-logger';

export interface DataExportFilter {
  userId?: string;
  format?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt?: [gte: Date, lte: Date];
}

export interface DataExportRequest {
  id: string;
  userId: string;
  format: string;
  status: string;
  filePath: string | null;
  requestedAt: Date;
  completedAt: Date | null;
  error: string | null;
}

export async function listDataExportRequests(filter: DataExportFilter = {}): Promise<DataExportRequest[]> {
  const { userId, format, status, ...filterRest } = filter;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }

  if (format) {
    where.format = format;
  }

  if (status) {
    where.status = status;
  }

  if (filterRest.requestedAt) {
    where.requestedAt = {
      gte: filterRest.requestedAt[0],
      lte: filterRest.requestedAt[1],
    };
  }

  const exports = await prisma.dataExportRequest.findMany({
    where,
    orderBy: { requestedAt: 'desc' },
  });

  return exports;
}

export async function createDataExportRequest(
  userId: string,
  format: string,
  filePath?: string | null
): Promise<DataExportRequest> {
  const { authUser, dbUser: userDbUser, role } = await getCurrentAuth();
  const tenantId = userDbUser?.tenantId ?? NULL_TENANT;

  const exportReq = await prisma.dataExportRequest.create({
    data: {
      user: { connect: { id: userId } },
      format,
      filePath,
      status: filePath ? 'completed' : 'pending',
      tenantId,
    },
  });

  // Audit log
  await auditLog({
    action: 'data_export.create',
    resource: 'DataExportRequest',
    resourceId: exportReq.id,
    changes: { userId, format, filePath, status: filePath ? 'completed' : 'pending' },
  });

  return exportReq;
}

export async function updateDataExportRequest(
  exportId: string,
  updates: Partial<{
    status: string;
    filePath: string | null;
    completedAt: Date | null;
    error: string | null;
  }>
): Promise<DataExportRequest> {
  const { authUser, dbUser: userDbUser, role } = await getCurrentAuth();

  const exportReq = await prisma.dataExportRequest.update({
    where: { id: exportId },
    data: updates,
  });

  // Audit log
  await auditLog({
    action: 'data_export.update',
    resource: 'DataExportRequest',
    resourceId: exportId,
    changes: updates,
  });

  return exportReq;
}

export async function failDataExportRequest(
  exportId: string,
  error: string | null
): Promise<DataExportRequest> {
  const { authUser, dbUser: userDbUser, role } = await getCurrentAuth();

  const exportReq = await prisma.dataExportRequest.update({
    where: { id: exportId },
    data: {
      status: 'failed',
      error,
    },
  });

  // Audit log
  await auditLog({
    action: 'data_export.fail',
    resource: 'DataExportRequest',
    resourceId: exportId,
    changes: { status: 'failed', error },
  });

  return exportReq;
}

export async function getDataExportRequestById(exportId: string): Promise<DataExportRequest | null> {
  const exportReq = await prisma.dataExportRequest.findUnique({
    where: { id: exportId },
  });

  return exportReq || null;
}