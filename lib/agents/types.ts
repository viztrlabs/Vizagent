// M15: Core Agent Types — 13 agents with deterministic state machines

export type AgentId =
  | 'ceo'
  | 'hermes'
  | 'webxr'
  | ' hear'
  | 'vr'
  | 'virtual-tour'
  | 'pixel-streaming'
  | 'website-developer'
  | 'finance'
  | 'analytics'
  | 'qa'
  | 'support'
  | 'design'
  | 'sales'
  | 'content';

// Fix: Remove the space typo in ' hear'
export type AgentIdClean =
  | 'ceo'
  | 'hermes'
  | 'webxr'
  | 'webar'
  | 'vr'
  | 'virtual-tour'
  | 'pixel-streaming'
  | 'website-developer'
  | 'finance'
  | 'analytics'
  | 'qa'
  | 'support'
  | 'design'
  | 'sales'
  | 'content';

export type AgentCategory = 'orchestrator' | 'xr-conversion' | 'service';

export type AgentState =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'waiting_approval'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'stopped';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AgentTask {
  id: string;
  agentId: AgentIdClean;
  type: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  state: AgentState;
  priority: TaskPriority;
  parentId?: string; // for sub-tasks spawned by CEO
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface AgentContext {
  taskId: string;
  agentId: AgentIdClean;
  tenantId: string;
  userId: string;
  input: Record<string, unknown>;
  tools: string[]; // allowed tool IDs
  budget: {
    maxTokens: number;
    maxTimeMs: number;
    maxCostUsd: number;
  };
}

export interface AgentResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  tokensUsed?: number;
  costUsd?: number;
  durationMs?: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
  category: 'file' | 'api' | 'database' | 'deployment' | 'analytics' | 'communication';
  requiresApproval: boolean;
  budgetCost: number; // tokens per call
}

export interface GuardrailRule {
  id: string;
  name: string;
  description: string;
  type: 'block' | 'require_approval' | 'log' | 'rate_limit';
  condition: string; // human-readable condition
  agentIds?: AgentIdClean[]; // if empty, applies to all
  toolIds?: string[]; // if empty, applies to all tools
  limit?: number; // for rate_limit type
  windowMs?: number; // for rate_limit type
}

export interface AgentMessage {
  id: string;
  from: AgentIdClean;
  to: AgentIdClean;
  type: 'task_assignment' | 'task_result' | 'status_update' | 'error' | 'approval_request';
  payload: Record<string, unknown>;
  timestamp: string;
}
