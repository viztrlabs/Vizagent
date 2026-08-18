// M15: Guardrails System — safety rules for agent execution
import { GuardrailRule, AgentIdClean } from './types';

const DEFAULT_GUARDRAILS: GuardrailRule[] = [
  {
    id: 'no-auto-spend',
    name: 'No Auto-Spend',
    description: 'Agents cannot execute financial transactions without human approval',
    type: 'require_approval',
    condition: 'Any action that involves spending money or creating invoices',
    toolIds: ['deploy.production', 'email.send'],
  },
  {
    id: 'no-prod-deploy',
    name: 'No Production Deploy',
    description: 'Production deployments require human approval',
    type: 'require_approval',
    condition: 'Deploying to production environment',
    toolIds: ['deploy.production'],
  },
  {
    id: 'no-contract-send',
    name: 'No Contract Send',
    description: 'Contracts and invoices cannot be sent without human sign-off',
    type: 'require_approval',
    condition: 'Sending contracts, invoices, or legal documents',
    agentIds: ['finance', 'sales'],
  },
  {
    id: 'data-privacy',
    name: 'Data Privacy',
    description: 'Private user data cannot be shared with external services',
    type: 'block',
    condition: 'Sharing personally identifiable information with external APIs',
    toolIds: ['api.call', 'email.send'],
  },
  {
    id: 'rate-limit-api',
    name: 'API Rate Limit',
    description: 'Limit external API calls to 100 per hour per agent',
    type: 'rate_limit',
    condition: 'External API calls',
    toolIds: ['api.call'],
    limit: 100,
    windowMs: 3600000,
  },
  {
    id: 'budget-limit',
    name: 'Budget Limit',
    description: 'Maximum 1M tokens per task',
    type: 'rate_limit',
    condition: 'Token usage per task',
    limit: 1000000,
    windowMs: 0, // per task, not time-based
  },
  {
    id: 'retry-limit',
    name: 'Retry Limit',
    description: 'Maximum 3 retries per failed task',
    type: 'block',
    condition: 'Task retry count exceeds maximum',
  },
];

const activeRateLimits: Map<string, { count: number; windowStart: number }> = new Map();

export function checkGuardrails(
  agentId: string,
  toolId: string,
  _context: Record<string, unknown>
): { allowed: boolean; rule?: GuardrailRule; message?: string } {
  for (const rule of DEFAULT_GUARDRAILS) {
    // Check if rule applies to this agent
    if (rule.agentIds && rule.agentIds.length > 0) {
      if (!rule.agentIds.includes(agentId as AgentIdClean)) continue;
    }

    // Check if rule applies to this tool
    if (rule.toolIds && rule.toolIds.length > 0) {
      if (!rule.toolIds.includes(toolId)) continue;
    }

    // Check rate limits
    if (rule.type === 'rate_limit' && rule.limit && rule.windowMs) {
      const key = `${agentId}:${toolId}`;
      const now = Date.now();
      const existing = activeRateLimits.get(key);

      if (existing) {
        if (now - existing.windowStart > rule.windowMs) {
          activeRateLimits.set(key, { count: 1, windowStart: now });
        } else if (existing.count >= rule.limit) {
          return {
            allowed: false,
            rule,
            message: `Rate limit exceeded: ${rule.limit} calls per ${rule.windowMs / 1000}s`,
          };
        } else {
          existing.count++;
        }
      } else {
        activeRateLimits.set(key, { count: 1, windowStart: now });
      }
    }

    // Block or require approval
    if (rule.type === 'block') {
      return { allowed: false, rule, message: `Blocked: ${rule.description}` };
    }
    if (rule.type === 'require_approval') {
      return { allowed: false, rule, message: `Requires approval: ${rule.description}` };
    }
  }

  return { allowed: true };
}

export function getGuardrails(): GuardrailRule[] {
  return [...DEFAULT_GUARDRAILS];
}
