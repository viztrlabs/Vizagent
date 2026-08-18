// M15: CEO Agent — Orchestrator that routes and plans all work
import { AgentContext, AgentResult, AgentTask, AgentIdClean } from './types';
import { BaseAgent } from './base-agent';
import { createTask } from './state-machine';

interface RoutingRule {
  pattern: RegExp;
  agentId: AgentIdClean;
  priority: AgentTask['priority'];
}

const ROUTING_RULES: RoutingRule[] = [
  // XR conversion tasks
  { pattern: /webxr|immersive|ar_vr/i, agentId: 'webxr', priority: 'medium' },
  { pattern: /webar|augmented|marker/i, agentId: 'webar', priority: 'medium' },
  { pattern: /vr_headset|oculus|quest/i, agentId: 'vr', priority: 'medium' },
  { pattern: /virtual.?tour|360|panoram/i, agentId: 'virtual-tour', priority: 'medium' },
  { pattern: /pixel.?stream|cloud.?render/i, agentId: 'pixel-streaming', priority: 'medium' },
  // Service tasks
  { pattern: /website|page|landing|cms/i, agentId: 'website-developer', priority: 'medium' },
  { pattern: /invoice|payment|billing|subscription/i, agentId: 'finance', priority: 'medium' },
  { pattern: /analytics|metrics|tracking|report/i, agentId: 'analytics', priority: 'medium' },
  { pattern: /qa|test|validation|check/i, agentId: 'qa', priority: 'medium' },
  { pattern: /support|ticket|help|issue/i, agentId: 'support', priority: 'medium' },
  { pattern: /design|ui|ux|mockup|wireframe/i, agentId: 'design', priority: 'medium' },
  { pattern: /sales|lead|pipeline|deal/i, agentId: 'sales', priority: 'medium' },
  { pattern: /content|copy|blog|copywriting/i, agentId: 'content', priority: 'medium' },
];

export class CEOAgent extends BaseAgent {
  readonly id = 'ceo';
  readonly name = 'CEO Agent';
  readonly category = 'orchestrator' as const;
  readonly description = 'Orchestrates all work, routes tasks to appropriate agents, manages budgets and approvals.';
  readonly allowedTools = ['*'];

  private taskQueue: AgentTask[] = [];
  private activeAgents: Map<string, AgentTask> = new Map();

  protected async run(context: AgentContext): Promise<AgentResult> {
    const { input } = context;

    // Parse the high-level request
    const request = input.request as string;
    const projectId = input.projectId as string | undefined;

    // Route to appropriate agent(s)
    const routed = this.routeRequest(request);

    if (routed.length === 0) {
      return {
        success: false,
        error: 'No matching agent found for request. Rephrase or specify the task type.',
      };
    }

    // Create sub-tasks
    const subTasks = routed.map(r =>
      createTask(r.agentId, 'execute', {
        request,
        projectId,
        ...input,
      }, r.priority)
    );

    return {
      success: true,
      output: {
        routedTo: subTasks.map(t => ({ agentId: t.agentId, taskId: t.id, priority: t.priority })),
        message: `Dispatched ${subTasks.length} task(s) to agents`,
      },
    };
  }

  routeRequest(request: string): { agentId: AgentIdClean; priority: AgentTask['priority'] }[] {
    const matches: { agentId: AgentIdClean; priority: AgentTask['priority'] }[] = [];

    for (const rule of ROUTING_RULES) {
      if (rule.pattern.test(request)) {
        matches.push({ agentId: rule.agentId, priority: rule.priority });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return matches.filter(m => {
      if (seen.has(m.agentId)) return false;
      seen.add(m.agentId);
      return true;
    });
  }

  getQueue(): AgentTask[] {
    return [...this.taskQueue];
  }

  getActive(): Map<string, AgentTask> {
    return new Map(this.activeAgents);
  }
}
