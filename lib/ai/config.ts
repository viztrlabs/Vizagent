import { AIProviderError } from './errors';
import type { AIProviderName } from './types';

export interface AIConfig {
  defaultProvider: AIProviderName;
  models: Record<AIProviderName, string>;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaBaseUrl: string;
}

const DEFAULT_MODELS: Record<AIProviderName, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  ollama: 'llama3.1',
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AIConfig {
  const defaultProviderRaw = (env.AI_DEFAULT_PROVIDER ?? 'openai').trim().toLowerCase();
  const defaultProvider: AIProviderName =
    defaultProviderRaw === 'anthropic' || defaultProviderRaw === 'ollama' ? defaultProviderRaw : 'openai';

  return {
    defaultProvider,
    models: {
      openai: (env.OPENAI_MODEL ?? DEFAULT_MODELS.openai).trim(),
      anthropic: (env.ANTHROPIC_MODEL ?? DEFAULT_MODELS.anthropic).trim(),
      ollama: (env.OLLAMA_MODEL ?? DEFAULT_MODELS.ollama).trim(),
    },
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    ollamaBaseUrl: (env.OLLAMA_BASE_URL ?? 'http://localhost:11434').trim().replace(/\/$/, ''),
  };
}

export function parseProviderRef(ref: string, config: AIConfig): { provider: AIProviderName; model: string } {
  const normalized = ref.trim();
  const isLocal = normalized === 'local';
  const [rawProvider, ...modelParts] = normalized.split('/');
  const rawName = isLocal ? 'ollama' : rawProvider;
  let provider: AIProviderName;
  if (rawName === 'openai' || rawName === 'anthropic' || rawName === 'ollama') {
    provider = rawName;
  } else {
    throw new AIProviderError(`Unknown AI provider: ${rawName}`, { provider: undefined });
  }
  const model = modelParts.length > 0 ? modelParts.join('/') : config.models[provider];
  return { provider, model };
}
