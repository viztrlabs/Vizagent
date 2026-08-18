// M15: Deterministic State Machine for Agent Lifecycle
import { AgentState, AgentTask } from './types';

const VALID_TRANSITIONS: Record<AgentState, AgentState[]> = {
  idle: ['planning', 'stopped'],
  planning: ['executing', 'failed', 'stopped'],
  executing: ['waiting_approval', 'paused', 'completed', 'failed', 'stopped'],
  waiting_approval: ['executing', 'failed', 'stopped'],
  paused: ['executing', 'stopped'],
  completed: ['idle'],
  failed: ['idle', 'planning'], // allow retry
  stopped: ['idle'],
};

export function canTransition(from: AgentState, to: AgentState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionTask(task: AgentTask, newState: AgentState, error?: string): AgentTask {
  if (!canTransition(task.state, newState)) {
    throw new Error(`Invalid transition: ${task.state} → ${newState}`);
  }

  const now = new Date().toISOString();
  const updated: AgentTask = {
    ...task,
    state: newState,
    updatedAt: now,
  };

  if (newState === 'executing' && !task.startedAt) {
    updated.startedAt = now;
  }
  if (newState === 'completed') {
    updated.completedAt = now;
  }
  if (newState === 'failed' && error) {
    updated.error = error;
  }

  return updated;
}

export function createTask(
  agentId: AgentTask['agentId'],
  type: string,
  input: Record<string, unknown>,
  priority: AgentTask['priority'] = 'medium',
  parentId?: string
): AgentTask {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    type,
    input,
    state: 'idle',
    priority,
    parentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 3,
  };
}
