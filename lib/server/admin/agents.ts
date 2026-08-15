import { prisma } from '@/lib/db/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/session';
import { auditLog } from '@/lib/server/audit/audit-logger';

export interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'error' | 'offline';
  currentTask?: string;
  lastHeartbeat: Date;
  tenantId: string;
}

export interface RunningTask {
  id: string;
  agentId: string;
  agentName: string;
  taskType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  tenantId: string;
}

export async function getAgentStatuses(): Promise<AgentStatus[]> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.agents.read');

  // In a real implementation, this would query an agent registry or cache
  // For now, return mock data based on the tenant
  const agents = await prisma.agent.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      currentTask: true,
      lastHeartbeat: true,
      tenantId: true,
    },
  });

  return agents as AgentStatus[];
}

export async function getRunningTasks(): Promise<RunningTask[]> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.agents.read');

  const tasks = await prisma.agentTask.findMany({
    where: { tenantId, status: { in: ['pending', 'running'] } },
    select: {
      id: true,
      agentId: true,
      agentName: true,
      taskType: true,
      status: true,
      progress: true,
      startedAt: true,
      tenantId: true,
    },
  });

  return tasks as RunningTask[];
}

export interface EmergencyStopInput {
  agentId: string;
  taskId?: string;
  reason: string;
}

export async function emergencyStopAgent(input: EmergencyStopInput): Promise<{ success: boolean }> {
  const { dbUser, tenantId, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.agents.control');

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    throw new Error('Only ADMIN or SUPER_ADMIN can emergency stop agents');
  }

  const agent = await prisma.agent.findFirst({
    where: { id: input.agentId, tenantId },
  });
  if (!agent) throw new Error('Agent not found');

  // In a real implementation, this would send a signal to the agent
  // For now, update the agent status and any running tasks
  await prisma.agent.update({
    where: { id: input.agentId },
    data: { status: 'offline', currentTask: null },
  });

  if (input.taskId) {
    await prisma.agentTask.update({
      where: { id: input.taskId },
      data: { status: 'failed', progress: 0 },
    });
  } else {
    await prisma.agentTask.updateMany({
      where: { agentId: input.agentId, status: { in: ['pending', 'running'] } },
      data: { status: 'failed', progress: 0 },
    });
  }

  await auditLog({
    action: 'admin.agent.emergency_stop',
    resource: 'agent',
    resourceId: input.agentId,
    changes: { taskId: input.taskId, reason: input.reason },
  });

  return { success: true };
}

export async function getAgent(id: string): Promise<AgentStatus | null> {
  const { tenantId, dbUser, role } = await getCurrentAuth();
  if (!dbUser) throw new Error('Unauthorized');
  await requirePermission('admin.agents.read');

  const agent = await prisma.agent.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      currentTask: true,
      lastHeartbeat: true,
      tenantId: true,
    },
  });

  return agent as AgentStatus | null;
}