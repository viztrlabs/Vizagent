import { AIProviderError } from '../errors';
import type { GenerateRequest, StreamChunk, TokenUsage } from '../types';
import type { AIProvider } from './provider';

interface OllamaProviderOptions {
  baseUrl: string;
  model: string;
}

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama' as const;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor({ baseUrl, model }: OllamaProviderOptions) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async complete(req: GenerateRequest): Promise<{ text: string; usage?: TokenUsage }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: req.prompt,
          system: req.system,
          stream: false,
          options: { temperature: req.temperature, num_predict: req.maxTokens },
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      const data = (await response.json()) as { response?: string; prompt_eval_count?: number; eval_count?: number };
      const usage: TokenUsage | undefined =
        data.prompt_eval_count !== undefined && data.eval_count !== undefined
          ? { inputTokens: data.prompt_eval_count, outputTokens: data.eval_count }
          : undefined;
      return { text: data.response ?? '', usage };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError('Ollama request failed', { provider: this.name, cause: error });
    }
  }

  async *stream(req: GenerateRequest): AsyncIterable<StreamChunk> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: req.prompt,
          system: req.system,
          stream: true,
          options: { temperature: req.temperature, num_predict: req.maxTokens },
        }),
      });
    } catch (error) {
      throw new AIProviderError('Ollama request failed', { provider: this.name, cause: error });
    }
    if (!response.ok) {
      throw new AIProviderError(`Ollama request failed: HTTP ${response.status}`, { provider: this.name });
    }
    if (!response.body) {
      throw new AIProviderError('Ollama returned no body', { provider: this.name });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const data = JSON.parse(line) as { response?: string; done?: boolean };
          if (data.done) {
            yield { type: 'done' };
          } else if (data.response) {
            yield { type: 'text', text: data.response };
          }
        }
      }
      yield { type: 'done' };
    } catch (error) {
      throw new AIProviderError('Ollama stream failed', { provider: this.name, cause: error });
    } finally {
      reader.releaseLock();
    }
  }
}
