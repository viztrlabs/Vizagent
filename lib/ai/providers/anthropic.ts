import Anthropic from '@anthropic-ai/sdk';
import { AIProviderError } from '../errors';
import type { GenerateRequest, StreamChunk, TokenUsage } from '../types';
import type { AIProvider } from './provider';

interface AnthropicProviderOptions {
  apiKey: string;
  model: string;
}

const DEFAULT_MAX_TOKENS = 1024;

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const;
  private readonly client: Anthropic;
  private readonly model: string;

  constructor({ apiKey, model }: AnthropicProviderOptions) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(req: GenerateRequest): Promise<{ text: string; usage?: TokenUsage }> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: req.system,
        messages: [{ role: 'user' as const, content: req.prompt }],
        temperature: req.temperature,
      });
      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');
      const usage: TokenUsage | undefined = response.usage
        ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
        : undefined;
      return { text, usage };
    } catch (error) {
      throw new AIProviderError('Anthropic request failed', { provider: this.name, cause: error });
    }
  }

  async *stream(req: GenerateRequest): AsyncIterable<StreamChunk> {
    let stream;
    try {
      stream = await this.client.messages.create({
        model: this.model,
        max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: req.system,
        messages: [{ role: 'user' as const, content: req.prompt }],
        temperature: req.temperature,
        stream: true,
      });
    } catch (error) {
      throw new AIProviderError('Anthropic request failed', { provider: this.name, cause: error });
    }
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', text: event.delta.text };
      }
    }
    yield { type: 'done' };
  }
}
