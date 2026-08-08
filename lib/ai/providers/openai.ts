import OpenAI from 'openai';
import { AIProviderError } from '../errors';
import type { GenerateRequest, StreamChunk, TokenUsage } from '../types';
import type { AIProvider } from './provider';

interface OpenAIProviderOptions {
  apiKey: string;
  model: string;
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor({ apiKey, model }: OpenAIProviderOptions) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async complete(req: GenerateRequest): Promise<{ text: string; usage?: TokenUsage }> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          ...(req.system ? [{ role: 'system' as const, content: req.system }] : []),
          { role: 'user' as const, content: req.prompt },
        ],
        temperature: req.temperature,
        max_tokens: req.maxTokens,
        stream: false,
      });
      const text = response.choices[0]?.message?.content ?? '';
      const usage: TokenUsage | undefined = response.usage
        ? { inputTokens: response.usage.prompt_tokens, outputTokens: response.usage.completion_tokens }
        : undefined;
      return { text, usage };
    } catch (error) {
      throw new AIProviderError('OpenAI request failed', { provider: this.name, cause: error });
    }
  }

  async *stream(req: GenerateRequest): AsyncIterable<StreamChunk> {
    let stream;
    try {
      stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          ...(req.system ? [{ role: 'system' as const, content: req.system }] : []),
          { role: 'user' as const, content: req.prompt },
        ],
        temperature: req.temperature,
        max_tokens: req.maxTokens,
        stream: true,
      });
    } catch (error) {
      throw new AIProviderError('OpenAI request failed', { provider: this.name, cause: error });
    }
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield { type: 'text', text: delta };
    }
    yield { type: 'done' };
  }
}
