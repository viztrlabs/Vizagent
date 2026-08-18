// M15: Tool Connector — uniform tool interface with per-agent allowlists
import { ToolDefinition } from '../types';

const TOOL_REGISTRY: Map<string, ToolDefinition> = new Map();

// Register built-in tools
const BUILTIN_TOOLS: ToolDefinition[] = [
  {
    id: 'file.read',
    name: 'Read File',
    description: 'Read contents of a file from the workspace',
    parameters: { path: { type: 'string', description: 'File path', required: true } },
    category: 'file',
    requiresApproval: false,
    budgetCost: 100,
  },
  {
    id: 'file.write',
    name: 'Write File',
    description: 'Write content to a file in the workspace',
    parameters: {
      path: { type: 'string', description: 'File path', required: true },
      content: { type: 'string', description: 'File content', required: true },
    },
    category: 'file',
    requiresApproval: true,
    budgetCost: 200,
  },
  {
    id: 'db.query',
    name: 'Database Query',
    description: 'Execute a read-only SQL query',
    parameters: { query: { type: 'string', description: 'SQL query', required: true } },
    category: 'database',
    requiresApproval: true,
    budgetCost: 150,
  },
  {
    id: 'deploy.preview',
    name: 'Deploy Preview',
    description: 'Create a preview deployment',
    parameters: { projectId: { type: 'string', description: 'Project ID', required: true } },
    category: 'deployment',
    requiresApproval: true,
    budgetCost: 500,
  },
  {
    id: 'deploy.production',
    name: 'Deploy Production',
    description: 'Deploy to production (requires approval)',
    parameters: { projectId: { type: 'string', description: 'Project ID', required: true } },
    category: 'deployment',
    requiresApproval: true,
    budgetCost: 1000,
  },
  {
    id: 'analytics.track',
    name: 'Track Event',
    description: 'Record an analytics event',
    parameters: {
      event: { type: 'string', description: 'Event name', required: true },
      properties: { type: 'object', description: 'Event properties' },
    },
    category: 'analytics',
    requiresApproval: false,
    budgetCost: 50,
  },
  {
    id: 'email.send',
    name: 'Send Email',
    description: 'Send an email notification',
    parameters: {
      to: { type: 'string', description: 'Recipient email', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
    category: 'communication',
    requiresApproval: true,
    budgetCost: 300,
  },
  {
    id: 'api.call',
    name: 'External API Call',
    description: 'Call an external API endpoint',
    parameters: {
      url: { type: 'string', description: 'API URL', required: true },
      method: { type: 'string', description: 'HTTP method' },
      body: { type: 'object', description: 'Request body' },
    },
    category: 'api',
    requiresApproval: true,
    budgetCost: 200,
  },
];

// Initialize registry
for (const tool of BUILTIN_TOOLS) {
  TOOL_REGISTRY.set(tool.id, tool);
}

// Agent tool allowlists
const AGENT_TOOL_ALLOWLISTS: Record<string, string[]> = {
  'ceo': ['*'],
  'hermes': ['file.read', 'file.write', 'db.query', 'deploy.preview', 'deploy.production', 'analytics.track'],
  'webxr': ['file.read', 'file.write', 'api.call', 'analytics.track'],
  'webar': ['file.read', 'file.write', 'api.call', 'analytics.track'],
  'vr': ['file.read', 'file.write', 'api.call', 'analytics.track'],
  'virtual-tour': ['file.read', 'file.write', 'api.call', 'analytics.track', 'deploy.preview'],
  'pixel-streaming': ['file.read', 'file.write', 'api.call', 'deploy.preview', 'deploy.production'],
  'website-developer': ['file.read', 'file.write', 'db.query', 'deploy.preview', 'analytics.track'],
  'finance': ['db.query', 'api.call', 'email.send', 'analytics.track'],
  'analytics': ['db.query', 'analytics.track', 'api.call'],
  'qa': ['file.read', 'db.query', 'analytics.track'],
  'support': ['email.send', 'db.query', 'analytics.track'],
  'design': ['file.read', 'file.write', 'api.call'],
  'sales': ['db.query', 'email.send', 'analytics.track'],
  'content': ['file.read', 'file.write', 'db.query', 'analytics.track'],
};

export function getTool(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.get(id);
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(TOOL_REGISTRY.values());
}

export function getToolsForAgent(agentId: string): ToolDefinition[] {
  const allowlist = AGENT_TOOL_ALLOWLISTS[agentId] || [];
  if (allowlist.includes('*')) return getAllTools();
  return getAllTools().filter(t => allowlist.includes(t.id));
}

export function canAgentUseTool(agentId: string, toolId: string): boolean {
  const allowlist = AGENT_TOOL_ALLOWLISTS[agentId] || [];
  if (allowlist.includes('*')) return true;
  return allowlist.includes(toolId);
}

export function requiresApproval(toolId: string): boolean {
  const tool = TOOL_REGISTRY.get(toolId);
  return tool?.requiresApproval ?? true;
}
