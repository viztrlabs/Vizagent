import { generate, streamGenerate } from './client';
import { OpenAIProvider } from './providers/openai';
import { OllamaProvider } from './providers/ollama';

jest.mock('./providers/openai', () => {
  const complete = jest.fn();
  const stream = jest.fn();
  return {
    OpenAIProvider: jest.fn().mockImplementation(() => ({ name: 'openai', complete, stream })),
  };
});
jest.mock('./providers/anthropic', () => {
  const complete = jest.fn();
  const stream = jest.fn();
  return {
    AnthropicProvider: jest.fn().mockImplementation(() => ({ name: 'anthropic', complete, stream })),
  };
});
jest.mock('./providers/ollama', () => {
  const complete = jest.fn();
  const stream = jest.fn();
  return {
    OllamaProvider: jest.fn().mockImplementation(() => ({ name: 'ollama', complete, stream })),
  };
});

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
