import { loadConfig, parseProviderRef } from './config';
import { AIProviderError } from './errors';
import type { GenerateRequest, GenerateResult, StreamChunk } from './types';
import type { AIProvider } from './providers/provider';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';

function getProvider(ref: string, config: ReturnType<typeof loadConfig>): AIProvider {
  const { provider, model } = parseProviderRef(ref, config);
  switch (provider) {
    case 'openai': {
      if (!config.openaiApiKey) {
        throw new AIProviderError('OPENAI_API_KEY is not configured', { provider: 'openai' });
      }
      return new OpenAIProvider({ apiKey: config.openaiApiKey, model });
    }
    case 'anthropic': {
      if (!config.anthropicApiKey) {
        throw new AIProviderError('ANTHROPIC_API_KEY is not configured', { provider: 'anthropic' });
      }
      return new AnthropicProvider({ apiKey: config.anthropicApiKey, model });
    }
    case 'ollama':
      return new OllamaProvider({ baseUrl: config.ollamaBaseUrl, model });
  }
}

export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  const config = loadConfig();
  const ref = req.provider ?? config.defaultProvider;
  const { provider, model } = parseProviderRef(ref, config);
  const aiProvider = getProvider(ref, config);
  const { text, usage } = await aiProvider.complete(req);
  return { text, provider, model, usage };
}

export async function* streamGenerate(req: GenerateRequest): AsyncIterable<StreamChunk> {
  const config = loadConfig();
  const ref = req.provider ?? config.defaultProvider;
  const aiProvider = getProvider(ref, config);
  yield* aiProvider.stream(req);
}
