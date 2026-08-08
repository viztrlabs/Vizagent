export type AIProviderName = 'openai' | 'anthropic' | 'ollama';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateRequest {
  prompt: string;
  system?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  provider: AIProviderName;
  model: string;
  usage?: TokenUsage;
}

export type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done'; usage?: TokenUsage };
