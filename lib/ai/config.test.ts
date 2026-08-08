import { loadConfig, parseProviderRef } from './config';

const base = {
  AI_DEFAULT_PROVIDER: 'openai',
  OPENAI_MODEL: 'gpt-4o-mini',
  ANTHROPIC_MODEL: 'claude-3-5-sonnet-latest',
  OLLAMA_MODEL: 'llama3.1',
  OLLAMA_BASE_URL: 'http://localhost:11434',
} as unknown as NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('applies defaults when no AI env is set', () => {
    const cfg = loadConfig({} as unknown as NodeJS.ProcessEnv);
    expect(cfg.defaultProvider).toBe('openai');
    expect(cfg.models.openai).toBe('gpt-4o-mini');
    expect(cfg.models.ollama).toBe('llama3.1');
    expect(cfg.ollamaBaseUrl).toBe('http://localhost:11434');
  });

  it('reads explicit env values', () => {
    const cfg = loadConfig({ ...base, AI_DEFAULT_PROVIDER: 'ollama', OLLAMA_BASE_URL: 'http://10.0.0.5:11434' } as unknown as NodeJS.ProcessEnv);
    expect(cfg.defaultProvider).toBe('ollama');
    expect(cfg.ollamaBaseUrl).toBe('http://10.0.0.5:11434');
    expect(cfg.openaiApiKey).toBeUndefined();
  });
});

describe('parseProviderRef', () => {
  const cfg = loadConfig(base);

  it('resolves bare provider name to default model', () => {
    expect(parseProviderRef('openai', cfg)).toEqual({ provider: 'openai', model: 'gpt-4o-mini' });
  });

  it('resolves provider/model shorthand', () => {
    expect(parseProviderRef('openai/gpt-4o', cfg)).toEqual({ provider: 'openai', model: 'gpt-4o' });
  });

  it('aliases "local" to ollama', () => {
    expect(parseProviderRef('local', cfg)).toEqual({ provider: 'ollama', model: 'llama3.1' });
  });

  it('throws on unknown provider', () => {
    expect(() => parseProviderRef('deepseek', cfg)).toThrow('Unknown AI provider');
  });
});
