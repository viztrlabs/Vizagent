// M15: Agent Service — manages task lifecycle, agent registry, and execution
import { AgentIdClean, AgentContext, AgentTask, AgentState } from './types';
import { createTask, transitionTask } from './state-machine';
import { CEOAgent } from './orchestrator';
import { HermesAgent } from './agents/hermes';
import { WebXRAgent } from './agents/webxr';
import { WebARAgent } from './agents/webar';
import { VRAgent } from './agents/vr';
import { VirtualTourAgent } from './agents/virtual-tour';
import { PixelStreamingAgent } from './agents/pixel-streaming';
import { WebsiteDeveloperAgent } from './agents/website-developer';
import { FinanceAgent } from './agents/finance';
import { AnalyticsAgent } from './agents/analytics-agent';
import { QAAgent } from './agents/qa';
import { SupportAgent } from './agents/support';
import { DesignAgent } from './agents/design';
import { SalesAgent } from './agents/sales';
import { ContentAgent } from './agents/content';
import { BaseAgent } from './base-agent';
import { getToolsForAgent } from './tools/connector';

// Agent registry
const AGENT_REGISTRY: Map<string, BaseAgent> = new Map();

function registerAgents(): void {
  const agents: BaseAgent[] = [
    new CEOAgent(),
    new HermesAgent(),
    new WebXRAgent(),
    new WebARAgent(),
    new VRAgent(),
    new VirtualTourAgent(),
    new PixelStreamingAgent(),
    new WebsiteDeveloperAgent(),
    new FinanceAgent(),
    new AnalyticsAgent(),
    new QAAgent(),
    new SupportAgent(),
    new DesignAgent(),
    new SalesAgent(),
    new ContentAgent(),
  ];

  for (const agent of agents) {
    AGENT_REGISTRY.set(agent.id, agent);
  }
}

registerAgents();

// In-memory task store (replace with DB in production)
const taskStore: Map<string, AgentTask> = new Map();
const messageLog: Array<{ from: string; to: string; type: string; payload: unknown; timestamp: string }> = [];

export function getAgent(agentId: string): BaseAgent | undefined {
  return AGENT_REGISTRY.get(agentId);
}

export function listAgents() {
  return Array.from(AGENT_REGISTRY.values()).map(a => ({
    id: a.id,
    name: a.name,
    category: a.category,
    description: a.description,
    allowedTools: a.allowedTools,
  }));
}

export async function dispatchTask(
  agentId: string,
  type: string,
  input: Record<string, unknown>,
  tenantId: string,
  userId: string,
  priority: AgentTask['priority'] = 'medium'
): Promise<AgentTask> {
  const agent = AGENT_REGISTRY.get(agentId);
  if (!agent) throw new Error(`Agent not found: ${agentId}`);

  const task = createTask(agentId as AgentIdClean, type, input, priority);
  taskStore.set(task.id, task);

  // Transition to planning
  const planned = transitionTask(task, 'planning');
  taskStore.set(planned.id, planned);

  // Build context
  const tools = getToolsForAgent(agentId);
  const context: AgentContext = {
    taskId: task.id,
    agentId: agentId as AgentIdClean,
    tenantId,
    userId,
    input,
    tools: tools.map(t => t.id),
    budget: {
      maxTokens: 1000000,
      maxTimeMs: 300000,
      maxCostUsd: 10,
    },
  };

  // Transition to executing
  const executing = transitionTask(planned, 'executing');
  taskStore.set(executing.id, executing);

  // Execute
  agent.setTask(executing);
  const result = await agent.execute(context);

  // Update task based on result
  let finalTask = taskStore.get(task.id)!;
  if (result.success) {
    finalTask = transitionTask(finalTask, 'completed');
    finalTask.output = result.output;
  } else {
    if (finalTask.retryCount < finalTask.maxRetries) {
      finalTask.retryCount++;
      finalTask = transitionTask(finalTask, 'failed', result.error);
    } else {
      finalTask = transitionTask(finalTask, 'failed', result.error);
    }
  }

  taskStore.set(finalTask.id, finalTask);

  // Log message
  messageLog.push({
    from: 'system',
    to: agentId,
    type: result.success ? 'task_result' : 'error',
    payload: result,
    timestamp: new Date().toISOString(),
  });

  return finalTask;
}

export async function routeHighLevelRequest(
  request: string,
  tenantId: string,
  userId: string,
  projectId?: string
): Promise<{ tasks: AgentTask[]; routedTo: string[] }> {
  // Use CEO agent to route
  const ceo = AGENT_REGISTRY.get('ceo') as CEOAgent;
  const ceoTask = createTask('ceo', 'route', { request, projectId });
  taskStore.set(ceoTask.id, ceoTask);

  const routed = ceo.routeRequest(request);
  const tasks: AgentTask[] = [];

  for (const r of routed) {
    const task = await dispatchTask(r.agentId, 'execute', {
      request,
      projectId,
    }, tenantId, userId, r.priority);
    tasks.push(task);
  }

  return {
    tasks,
    routedTo: routed.map(r => r.agentId),
  };
}

export function getTask(taskId: string): AgentTask | undefined {
  return taskStore.get(taskId);
}

export function listTasks(filters?: { agentId?: string; state?: AgentState }): AgentTask[] {
  let tasks = Array.from(taskStore.values());
  if (filters?.agentId) tasks = tasks.filter(t => t.agentId === filters.agentId);
  if (filters?.state) tasks = tasks.filter(t => t.state === filters.state);
  return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function stopTask(taskId: string): AgentTask | undefined {
  const task = taskStore.get(taskId);
  if (!task) return undefined;
  if (task.state === 'completed' || task.state === 'stopped') return task;

  const stopped = transitionTask(task, 'stopped');
  taskStore.set(stopped.id, stopped);
  return stopped;
}

export function getMessages() {
  return [...messageLog].reverse().slice(0, 100);
}

export function getAgentStats() {
  const tasks = Array.from(taskStore.values());
  const agentStats: Record<string, { total: number; completed: number; failed: number; active: number }> = {};

  for (const task of tasks) {
    if (!agentStats[task.agentId]) {
      agentStats[task.agentId] = { total: 0, completed: 0, failed: 0, active: 0 };
    }
    agentStats[task.agentId].total++;
    if (task.state === 'completed') agentStats[task.agentId].completed++;
    if (task.state === 'failed') agentStats[task.agentId].failed++;
    if (['executing', 'planning', 'waiting_approval'].includes(task.state)) {
      agentStats[task.agentId].active++;
    }
  }

  return {
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => ['executing', 'planning', 'waiting_approval'].includes(t.state)).length,
    completedTasks: tasks.filter(t => t.state === 'completed').length,
    failedTasks: tasks.filter(t => t.state === 'failed').length,
    agentStats,
  };
}
