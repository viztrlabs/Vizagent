import { AgentContext, AgentResult } from '../types';
import { BaseAgent } from '../base-agent';

export class ContentAgent extends BaseAgent {
  readonly id = 'content';
  readonly name = 'Content Agent';
  readonly category = 'service' as const;
  readonly description = 'Creates and edits copy, blog posts, descriptions, and marketing content.';
  readonly allowedTools = ['file.read', 'file.write', 'db.query', 'analytics.track'];

  protected async run(_context: AgentContext): Promise<AgentResult> {
    return {
      success: true,
      output: {
        agent: this.id,
        action: 'content_generate',
        message: 'Content generation task queued.',
      },
    };
  }
}