// M15: Base Agent Class — all 13 agents extend this
import { AgentContext, AgentResult, AgentState, AgentTask } from './types';
import { transitionTask } from './state-machine';

export abstract class BaseAgent {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly category: 'orchestrator' | 'xr-conversion' | 'service';
  abstract readonly description: string;
  abstract readonly allowedTools: string[];

  protected task: AgentTask | null = null;
  protected context: AgentContext | null = null;

  async execute(context: AgentContext): Promise<AgentResult> {
    this.context = context;
    const startTime = Date.now();

    try {
      // Validate tool access
      const unauthorizedTools = context.tools.filter(
        t => !this.allowedTools.includes(t) && this.allowedTools !== (['*'] as string[])
      );
      if (unauthorizedTools.length > 0) {
        return {
          success: false,
          error: `Unauthorized tools: ${unauthorizedTools.join(', ')}`,
        };
      }

      // Execute with timeout
      const result = await Promise.race([
        this.run(context),
        new Promise<AgentResult>((_, reject) =>
          setTimeout(() => reject(new Error('Agent execution timeout')), context.budget.maxTimeMs)
        ),
      ]);

      return {
        ...result,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };
    }
  }

  protected abstract run(context: AgentContext): Promise<AgentResult>;

  updateState(newState: AgentState): AgentTask {
    if (!this.task) throw new Error('No task set');
    this.task = transitionTask(this.task, newState);
    return this.task;
  }

  setTask(task: AgentTask): void {
    this.task = task;
  }
}
