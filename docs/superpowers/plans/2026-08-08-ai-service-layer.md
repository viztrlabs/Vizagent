# AI Service Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the multi-provider AI foundation (OpenAI + Anthropic + Ollama) with a simple `generate()`/`streamGenerate()` API that all Phase 3 AI features (scene-gen, QA, tagging) will call.

**Architecture:** A provider interface (`AIProvider`) with three implementations (OpenAI, Anthropic, Ollama). A thin `client.ts` resolves the provider from env default (`AI_DEFAULT_PROVIDER`) with per-call override, and exposes `generate()` and `streamGenerate()`. All providers return the same `GenerateResult` shape so callers never touch SDKs directly.

**Tech Stack:** TypeScript, `openai` SDK, `@anthropic-ai/sdk`, Ollama REST API (`fetch`), jest + ts-jest (existing setup). Env-driven config only — no DB schema, no API routes (those come in later sub-projects).

## Global Constraints

- Node `>=20` (global `fetch` available — no undici import needed).
- No new env vars beyond the AI_ prefix family documented below.
- Tests live next to source as `<name>.test.ts` (existing convention, see `lib/server/lib/r2.test.ts`).
- `import` order per existing files: node/builtin, external packages, then local `@/` paths.
- Do NOT commit any real API keys. Env vars are documented in README only.
- Each provider must be testable without network — mock the SDK/fetch in tests.
- Keep the public API surface to exactly: `generate()`, `streamGenerate()`, `parseProviderRef()`, `loadConfig()`.

---

### Task 1: Install dependencies and create the shared types

**Files:**
- Modify: `package.json` (add `openai` and `@anthropic-ai/sdk`)
- Create: `lib/ai/types.ts`
- Create: `lib/ai/errors.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type AIProviderName = 'openai' | 'anthropic' | 'ollama'`
  - `interface GenerateRequest { prompt: string; system?: string; provider?: string; temperature?: number; maxTokens?: number }`
  - `interface GenerateResult { text: string; provider: AIProviderName; model: string; usage?: { inputTokens: number; outputTokens: number } }`
  - `interface StreamChunk { type: 'text'; text: string } | { type: 'done'; usage?: { inputTokens: number; outputTokens: number } }`
  - `class AIProviderError extends Error { constructor(message: string, options?: { provider?: AIProviderName; cause?: unknown }) }`

- [ ] **Step 1: Install the SDKs**

Run: `pnpm add openai @anthropic-ai/sdk`
Expected: exit 0, both packages appear in `package.json` dependencies.

- [ ] **Step 2: Create `lib/ai/types.ts`**

```ts
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
```

- [ ] **Step 3: Create `lib/ai/errors.ts`**

```ts
import type { AIProviderName } from './types';

export class AIProviderError extends Error {
  readonly provider?: AIProviderName;
  readonly cause?: unknown;

  constructor(message: string, options?: { provider?: AIProviderName; cause?: unknown }) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = options?.provider;
    this.cause = options?.cause;
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS, no new errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml lib/ai/types.ts lib/ai/errors.ts
git commit -m "feat(ai): add SDK deps and shared AI types"
```

---

### Task 2: Config loader and provider-ref parser

**Files:**
- Create: `lib/ai/config.ts`
- Test: `lib/ai/config.test.ts`

**Interfaces:**
- Consumes: `AIProviderName` from `./types`
- Produces:
  - `interface AIConfig { defaultProvider: AIProviderName; models: Record<AIProviderName, string>; openaiApiKey?: string; anthropicApiKey?: string; ollamaBaseUrl: string }`
  - `function loadConfig(env: NodeJS.ProcessEnv): AIConfig` — `AI_DEFAULT_PROVIDER` (default `'openai'`), `OPENAI_MODEL` (default `'gpt-4o-mini'`), `ANTHROPIC_MODEL` (default `'claude-3-5-sonnet-latest'`), `OLLAMA_MODEL` (default `'llama3.1'`), `OLLAMA_BASE_URL` (default `'http://localhost:11434'`), `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
  - `function parseProviderRef(ref: string, config: AIConfig): { provider: AIProviderName; model: string }` — supports `'openai'`, `'openai/gpt-4o'`, `'ollama/llama3.2'`, `'local'` (alias for ollama). Throws `AIProviderError` on unknown prefix.

- [ ] **Step 1: Write the failing test `lib/ai/config.test.ts`**

```ts
import { loadConfig, parseProviderRef } from './config';

const base = {
  AI_DEFAULT_PROVIDER: 'openai',
  OPENAI_MODEL: 'gpt-4o-mini',
  ANTHROPIC_MODEL: 'claude-3-5-sonnet-latest',
  OLLAMA_MODEL: 'llama3.1',
  OLLAMA_BASE_URL: 'http://localhost:11434',
} as NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('applies defaults when no AI env is set', () => {
    const cfg = loadConfig({} as NodeJS.ProcessEnv);
    expect(cfg.defaultProvider).toBe('openai');
    expect(cfg.models.openai).toBe('gpt-4o-mini');
    expect(cfg.models.ollama).toBe('llama3.1');
    expect(cfg.ollamaBaseUrl).toBe('http://localhost:11434');
  });

  it('reads explicit env values', () => {
    const cfg = loadConfig({ ...base, AI_DEFAULT_PROVIDER: 'ollama', OLLAMA_BASE_URL: 'http://10.0.0.5:11434' } as NodeJS.ProcessEnv);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/ai/config.test.ts`
Expected: FAIL with "Cannot find module './config'"

- [ ] **Step 3: Implement `lib/ai/config.ts`**

```ts
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
  const provider: AIProviderName =
    rawName === 'anthropic' || rawName === 'ollama' ? rawName : rawName === 'openai' ? 'openai' : (() => {
      throw new AIProviderError(`Unknown AI provider: ${rawName}`, { provider: undefined });
    })();
  const model = modelParts.length > 0 ? modelParts.join('/') : config.models[provider];
  return { provider, model };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/ai/config.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/config.ts lib/ai/config.test.ts
git commit -m "feat(ai): add config loader and provider-ref parser"
```

---

### Task 3: Provider interface + OpenAI provider

**Files:**
- Create: `lib/ai/providers/provider.ts`
- Create: `lib/ai/providers/openai.ts`
- Test: `lib/ai/providers/openai.test.ts`

**Interfaces:**
- Consumes: `AIProviderName`, `TokenUsage`, `StreamChunk`, `GenerateRequest` from `../types`; `AIProviderError` from `../errors`
- Produces:
  - `interface AIProvider { name: AIProviderName; complete(req: GenerateRequest): Promise<{ text: string; usage?: TokenUsage }>; stream(req: GenerateRequest): AsyncIterable<StreamChunk> }`
  - `class OpenAIProvider implements AIProvider` — `name = 'openai'`, takes `{ apiKey, model }` in constructor

- [ ] **Step 1: Write the failing test `lib/ai/providers/openai.test.ts`**

```ts
import OpenAI from 'openai';
import { OpenAIProvider } from './openai';

jest.mock('openai', () => {
  const create = jest.fn();
  return {
    __esModule: true,
    default: jest.fn(() => ({ chat: { completions: { create } } })),
  };
});

const mockedCreate = OpenAI.prototype?.chat?.completions?.create as jest.Mock ?? (OpenAI as unknown as jest.Mock)().chat.completions.create as jest.Mock;

describe('OpenAIProvider', () => {
  const provider = new OpenAIProvider({ apiKey: 'test-key', model: 'gpt-4o-mini' });

  beforeEach(() => mockedCreate.mockReset());

  it('returns text and usage for a non-streaming request', async () => {
    mockedCreate.mockResolvedValue({
      choices: [{ message: { content: 'Hello from OpenAI' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const res = await provider.complete({ prompt: 'Hi' });
    expect(res.text).toBe('Hello from OpenAI');
    expect(res.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini', stream: false })
    );
  });

  it('yields text chunks then a done chunk when streaming', async () => {
    mockedCreate.mockResolvedValue(
      (async function* () {
        yield { choices: [{ delta: { content: 'Hel' } }] };
        yield { choices: [{ delta: { content: 'lo' } }] };
      })()
    );

    const chunks: string[] = [];
    let doneUsage;
    for await (const chunk of provider.stream({ prompt: 'Hi', temperature: 0.5 })) {
      if (chunk.type === 'text') chunks.push(chunk.text);
      else doneUsage = chunk.usage;
    }
    expect(chunks).toEqual(['Hel', 'lo']);
    expect(mockedCreate).toHaveBeenCalledWith(expect.objectContaining({ stream: true }));
  });

  it('wraps SDK errors in AIProviderError', async () => {
    mockedCreate.mockRejectedValue(new Error('rate limited'));
    await expect(provider.complete({ prompt: 'Hi' })).rejects.toThrow('OpenAI request failed');
  });
});
```

Note: the mock-instance wiring in the first `const` line above can be fragile under ts-jest. If `mockedCreate` resolves to `undefined`, simplify to:

```ts
const mockOpenAI = OpenAI as unknown as jest.Mock;
const provider = new OpenAIProvider({ apiKey: 'test-key', model: 'gpt-4o-mini' });
const mockedCreate = mockOpenAI().chat.completions.create as jest.Mock;
```

Use whichever variant passes cleanly under the existing jest.config.ts transform.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/ai/providers/openai.test.ts`
Expected: FAIL with "Cannot find module './openai'"

- [ ] **Step 3: Create `lib/ai/providers/provider.ts`**

```ts
import type { GenerateRequest, StreamChunk, TokenUsage } from '../types';

export interface AIProvider {
  name: 'openai' | 'anthropic' | 'ollama';
  complete(req: GenerateRequest): Promise<{ text: string; usage?: TokenUsage }>;
  stream(req: GenerateRequest): AsyncIterable<StreamChunk>;
}
```

- [ ] **Step 4: Create `lib/ai/providers/openai.ts`**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test lib/ai/providers/openai.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/ai/providers/provider.ts lib/ai/providers/openai.ts lib/ai/providers/openai.test.ts
git commit -m "feat(ai): add provider interface and OpenAI provider"
```

---

### Task 4: Anthropic provider

**Files:**
- Create: `lib/ai/providers/anthropic.ts`
- Test: `lib/ai/providers/anthropic.test.ts`

**Interfaces:**
- Consumes: `AIProvider` from `./provider`; types from `../types`; `AIProviderError` from `../errors`
- Produces: `class AnthropicProvider implements AIProvider` — `name = 'anthropic'`, constructor `{ apiKey, model }`

- [ ] **Step 1: Write the failing test `lib/ai/providers/anthropic.test.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicProvider } from './anthropic';

jest.mock('@anthropic-ai/sdk', () => {
  const create = jest.fn();
  return {
    __esModule: true,
    default: jest.fn(() => ({ messages: { create } })),
  };
});

const mockAnthropic = Anthropic as unknown as jest.Mock;

describe('AnthropicProvider', () => {
  const provider = new AnthropicProvider({ apiKey: 'test-key', model: 'claude-3-5-sonnet-latest' });
  const mockedCreate = mockAnthropic().messages.create as jest.Mock;

  beforeEach(() => mockedCreate.mockReset());

  it('returns text and usage for a non-streaming request', async () => {
    mockedCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello from Claude' }],
      usage: { input_tokens: 8, output_tokens: 4 },
    });

    const res = await provider.complete({ prompt: 'Hi' });
    expect(res.text).toBe('Hello from Claude');
    expect(res.usage).toEqual({ inputTokens: 8, outputTokens: 4 });
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-3-5-sonnet-latest', max_tokens: expect.any(Number) })
    );
  });

  it('yields text chunks then a done chunk when streaming', async () => {
    mockedCreate.mockResolvedValue(
      (async function* () {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Go' } };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'od' } };
      })()
    );

    const chunks: string[] = [];
    for await (const chunk of provider.stream({ prompt: 'Hi' })) {
      if (chunk.type === 'text') chunks.push(chunk.text);
    }
    expect(chunks).toEqual(['Go', 'od']);
  });

  it('wraps SDK errors in AIProviderError', async () => {
    mockedCreate.mockRejectedValue(new Error('overloaded'));
    await expect(provider.complete({ prompt: 'Hi' })).rejects.toThrow('Anthropic request failed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/ai/providers/anthropic.test.ts`
Expected: FAIL with "Cannot find module './anthropic'"

- [ ] **Step 3: Implement `lib/ai/providers/anthropic.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/ai/providers/anthropic.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/providers/anthropic.ts lib/ai/providers/anthropic.test.ts
git commit -m "feat(ai): add Anthropic provider"
```

---

### Task 5: Ollama provider (local)

**Files:**
- Create: `lib/ai/providers/ollama.ts`
- Test: `lib/ai/providers/ollama.test.ts`

**Interfaces:**
- Consumes: `AIProvider` from `./provider`; types from `../types`; `AIProviderError` from `../errors`
- Produces: `class OllamaProvider implements AIProvider` — `name = 'ollama'`, constructor `{ baseUrl, model }`. Uses the Ollama REST API: `POST /api/generate` (stream: false → `{ response }`, stream: true → NDJSON lines with `{ response, done }`).

- [ ] **Step 1: Write the failing test `lib/ai/providers/ollama.test.ts`**

```ts
import { OllamaProvider } from './ollama';

describe('OllamaProvider', () => {
  const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: 'llama3.1' });
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('calls /api/generate and returns the response text', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Hello from Ollama' }),
    } as Response);

    const res = await provider.complete({ prompt: 'Hi' });
    expect(res.text).toBe('Hello from Ollama');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws AIProviderError on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'boom',
    } as Response);

    await expect(provider.complete({ prompt: 'Hi' })).rejects.toThrow('Ollama request failed');
  });

  it('parses NDJSON stream into text chunks then done', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ response: 'he' }) + '\n'));
        controller.enqueue(encoder.encode(JSON.stringify({ response: 'y' }) + '\n'));
        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
        controller.close();
      },
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, body } as Response);

    const chunks: string[] = [];
    let doneSeen = false;
    for await (const chunk of provider.stream({ prompt: 'Hi' })) {
      if (chunk.type === 'text') chunks.push(chunk.text);
      else doneSeen = true;
    }
    expect(chunks).toEqual(['he', 'y']);
    expect(doneSeen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/ai/providers/ollama.test.ts`
Expected: FAIL with "Cannot find module './ollama'"

- [ ] **Step 3: Implement `lib/ai/providers/ollama.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/ai/providers/ollama.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/providers/ollama.ts lib/ai/providers/ollama.test.ts
git commit -m "feat(ai): add Ollama provider"
```

---

### Task 6: Public client (generate + streamGenerate)

**Files:**
- Create: `lib/ai/client.ts`
- Test: `lib/ai/client.test.ts`

**Interfaces:**
- Consumes: `loadConfig`, `parseProviderRef` from `./config`; `AIProvider` from `./providers/provider`; `OpenAIProvider`, `AnthropicProvider`, `OllamaProvider`; types from `./types`
- Produces:
  - `function generate(req: GenerateRequest): Promise<GenerateResult>` — resolves provider via `req.provider ?? config.defaultProvider`, delegates to provider.complete, returns `{ text, provider, model, usage }`
  - `async function* streamGenerate(req: GenerateRequest): AsyncIterable<StreamChunk>` — same routing, delegates to provider.stream

- [ ] **Step 1: Write the failing test `lib/ai/client.test.ts`**

```ts
import { generate, streamGenerate } from './client';
import { loadConfig } from './config';
import { OpenAIProvider } from './providers/openai';
import { OllamaProvider } from './providers/ollama';

jest.mock('./providers/openai', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    name: 'openai',
    complete: jest.fn(),
    stream: jest.fn(),
  })),
}));
jest.mock('./providers/anthropic', () => ({
  AnthropicProvider: jest.fn().mockImplementation(() => ({
    name: 'anthropic',
    complete: jest.fn(),
    stream: jest.fn(),
  })),
}));
jest.mock('./providers/ollama', () => ({
  OllamaProvider: jest.fn().mockImplementation(() => ({
    name: 'ollama',
    complete: jest.fn(),
    stream: jest.fn(),
  })),
}));

const mockedOpenAI = OpenAIProvider as unknown as jest.Mock;
const mockedOllama = OllamaProvider as unknown as jest.Mock;

describe('generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_DEFAULT_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-test';
  });

  it('routes to the default provider when no override is given', async () => {
    (mockedOpenAI().complete as jest.Mock).mockResolvedValue({
      text: 'default result',
      usage: { inputTokens: 1, outputTokens: 1 },
    });

    const res = await generate({ prompt: 'Hi' });
    expect(res.text).toBe('default result');
    expect(res.provider).toBe('openai');
    expect(mockedOpenAI().complete).toHaveBeenCalled();
  });

  it('routes to ollama when provider override is "local"', async () => {
    (mockedOllama().complete as jest.Mock).mockResolvedValue({ text: 'local result' });

    const res = await generate({ prompt: 'Hi', provider: 'local' });
    expect(res.provider).toBe('ollama');
    expect(res.text).toBe('local result');
  });

  it('rethrows AIProviderError when provider fails', async () => {
    (mockedOpenAI().complete as jest.Mock).mockRejectedValue(new Error('nope'));
    await expect(generate({ prompt: 'Hi' })).rejects.toThrow('nope');
  });
});

describe('streamGenerate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_DEFAULT_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-test';
  });

  it('streams chunks from the resolved provider', async () => {
    (mockedOpenAI().stream as jest.Mock).mockReturnValue(
      (async function* () {
        yield { type: 'text', text: 'a' };
        yield { type: 'text', text: 'b' };
        yield { type: 'done' };
      })()
    );

    const chunks: string[] = [];
    for await (const chunk of streamGenerate({ prompt: 'Hi' })) {
      if (chunk.type === 'text') chunks.push(chunk.text);
    }
    expect(chunks).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/ai/client.test.ts`
Expected: FAIL with "Cannot find module './client'"

- [ ] **Step 3: Implement `lib/ai/client.ts`**

```ts
import { loadConfig, parseProviderRef } from './config';
import { AIProviderError } from './errors';
import type { GenerateRequest, GenerateResult, StreamChunk } from './types';
import type { AIProvider } from './providers/provider';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';

const config = loadConfig();

function getProvider(ref: string): AIProvider {
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
  const ref = req.provider ?? config.defaultProvider;
  const { provider, model } = parseProviderRef(ref, config);
  const aiProvider = getProvider(ref);
  const { text, usage } = await aiProvider.complete(req);
  return { text, provider, model, usage };
}

export async function* streamGenerate(req: GenerateRequest): AsyncIterable<StreamChunk> {
  const ref = req.provider ?? config.defaultProvider;
  const aiProvider = getProvider(ref);
  yield* aiProvider.stream(req);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/ai/client.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full AI test suite + typecheck**

Run: `pnpm test lib/ai` then `pnpm exec tsc --noEmit`
Expected: PASS (all AI tests), typecheck clean

- [ ] **Step 6: Commit**

```bash
git add lib/ai/client.ts lib/ai/client.test.ts
git commit -m "feat(ai): add public generate and streamGenerate client"
```

---

### Task 7: Document env vars in README

**Files:**
- Modify: `README.md` (add an "AI Configuration" section after the existing env-var sections)

**Interfaces:**
- Consumes: `AIConfig` env var names from Task 2

- [ ] **Step 1: Add the README section**

Add after the Resend/CRON block (around line 58):

````markdown
**8. AI providers (optional — used by scene generation, QA, and tagging):**

Default provider is OpenAI. Set `AI_DEFAULT_PROVIDER=ollama` to use a local
Ollama server, or override per-call by passing `provider: 'local'` / `provider: 'openai/gpt-4o'`.

```env
AI_DEFAULT_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1"
```
````

- [ ] **Step 2: Verify docs render**

Run: none (markdown). Review the inserted block for formatting consistency with the file.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document AI provider env vars"
```

---

## Self-Review

**Spec coverage:**
- Multi-provider interface (OpenAI + Anthropic + Ollama) → Tasks 3, 4, 5 ✓
- Simple `generate()` + `streamGenerate()` → Task 6 ✓
- Env-based default + per-call override → Tasks 2, 6 ✓
- "It depends on the user" local/cloud flexibility → `provider` override + `local` alias in Task 2/6 ✓
- README env docs → Task 7 ✓

**Placeholder scan:** No TBDs; every step has concrete code or a runnable command.

**Type consistency:** `GenerateRequest`, `GenerateResult`, `StreamChunk`, `TokenUsage`, `AIProviderName` used identically across tasks. Provider classes all implement `AIProvider` (`complete`/`stream`). `parseProviderRef` return shape `{ provider, model }` matches usage in `client.ts`. `loadConfig()` reads all env names that README documents.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-08-ai-service-layer.md`.
