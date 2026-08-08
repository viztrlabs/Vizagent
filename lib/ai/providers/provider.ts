import type { GenerateRequest, StreamChunk, TokenUsage } from '../types';

export interface AIProvider {
  name: 'openai' | 'anthropic' | 'ollama';
  complete(req: GenerateRequest): Promise<{ text: string; usage?: TokenUsage }>;
  stream(req: GenerateRequest): AsyncIterable<StreamChunk>;
}
